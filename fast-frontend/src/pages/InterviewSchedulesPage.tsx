import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../shared/context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiErrorState from '../components/ApiErrorState';
import { interviewSchedulesApi } from '../shared/api/interviewSchedulesApi';
import type { InterviewSchedule, InterviewScheduleRequest } from '../shared/types';

const TIME_SLOTS = Array.from({ length: 14 }, (_, index) => {
  const hour = 8 + index;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const SEGMENT_COLORS = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-cyan-500',
];

type TimelineSegment = {
  label: string;
  startSlot: string;
  endSlot: string;
  startIndex: number;
  span: number;
};

function addOneHour(slot: string): string {
  const hour = Number(slot.slice(0, 2));
  return `${String(hour + 1).padStart(2, '0')}:00`;
}

function buildEmptyForm(): InterviewScheduleRequest {
  return {
    businessArea: '',
    pcDirector: '',
    productController: '',
    namedPnls: '',
    location: '',
    interviewedBy: '',
    interviewDate: new Date().toISOString().slice(0, 10),
    entries: TIME_SLOTS.map((timeSlot) => ({
      timeSlot,
      businessFunction: '',
      applicationsUsed: '',
      processImprovements: '',
      techIssuesToResolve: '',
      ticketRaised: '',
    })),
  };
}

function toForm(schedule: InterviewSchedule): InterviewScheduleRequest {
  const bySlot = new Map(schedule.entries.map((entry) => [entry.timeSlot, entry]));
  return {
    businessArea: schedule.businessArea ?? '',
    pcDirector: schedule.pcDirector ?? '',
    productController: schedule.productController ?? '',
    namedPnls: schedule.namedPnls ?? '',
    location: schedule.location ?? '',
    interviewedBy: schedule.interviewedBy ?? '',
    interviewDate: schedule.interviewDate ?? new Date().toISOString().slice(0, 10),
    entries: TIME_SLOTS.map((timeSlot) => ({
      timeSlot,
      businessFunction: bySlot.get(timeSlot)?.businessFunction ?? '',
      applicationsUsed: bySlot.get(timeSlot)?.applicationsUsed ?? '',
      processImprovements: bySlot.get(timeSlot)?.processImprovements ?? '',
      techIssuesToResolve: bySlot.get(timeSlot)?.techIssuesToResolve ?? '',
      ticketRaised: bySlot.get(timeSlot)?.ticketRaised ?? '',
    })),
  };
}

function toPayload(form: InterviewScheduleRequest): InterviewScheduleRequest {
  return {
    businessArea: form.businessArea?.trim() ?? '',
    pcDirector: form.pcDirector?.trim() ?? '',
    productController: form.productController?.trim() ?? '',
    namedPnls: form.namedPnls?.trim() ?? '',
    location: form.location?.trim() ?? '',
    interviewedBy: form.interviewedBy?.trim() ?? '',
    interviewDate: form.interviewDate,
    entries: form.entries.map((entry) => ({
      timeSlot: entry.timeSlot,
      businessFunction: entry.businessFunction?.trim() ?? '',
      applicationsUsed: entry.applicationsUsed?.trim() ?? '',
      processImprovements: entry.processImprovements?.trim() ?? '',
      techIssuesToResolve: entry.techIssuesToResolve?.trim() ?? '',
      ticketRaised: entry.ticketRaised?.trim() ?? '',
    })),
  };
}

function computeTimeline(entries: InterviewScheduleRequest['entries']): TimelineSegment[] {
  const bySlot = new Map(entries.map((entry) => [entry.timeSlot, (entry.businessFunction ?? '').trim()]));
  const values = TIME_SLOTS.map((slot) => bySlot.get(slot) ?? '');
  const segments: TimelineSegment[] = [];

  let activeLabel = '';
  let startIndex = -1;
  const flushSegment = (endIndex: number) => {
    if (startIndex < 0 || activeLabel === '') return;
    segments.push({
      label: activeLabel,
      startSlot: TIME_SLOTS[startIndex],
      endSlot: addOneHour(TIME_SLOTS[endIndex]),
      startIndex,
      span: endIndex - startIndex + 1,
    });
  };

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (!value) {
      flushSegment(i - 1);
      startIndex = -1;
      activeLabel = '';
      continue;
    }
    if (startIndex === -1) {
      startIndex = i;
      activeLabel = value;
      continue;
    }
    if (value !== activeLabel) {
      flushSegment(i - 1);
      startIndex = i;
      activeLabel = value;
    }
  }
  flushSegment(values.length - 1);
  return segments;
}

export default function InterviewSchedulesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sheetInputClass = 'w-full bg-transparent px-2 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-sky-50';
  const metaInputClass = 'mt-1 w-full border border-amber-300 rounded-none px-2 py-2 text-sm bg-amber-50 focus:outline-none focus:bg-amber-100';

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<InterviewScheduleRequest>(() => buildEmptyForm());
  const [validationError, setValidationError] = useState<string>('');

  const { data: schedules = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['interview-schedules'],
    queryFn: () => interviewSchedulesApi.list(),
    enabled: Boolean(user),
    retry: 2,
  });

  const { data: selectedSchedule, isLoading: isLoadingSelected } = useQuery({
    queryKey: ['interview-schedules', selectedId],
    queryFn: () => interviewSchedulesApi.getById(selectedId as number),
    enabled: selectedId != null,
  });

  useEffect(() => {
    if (selectedSchedule) {
      setForm(toForm(selectedSchedule));
      setValidationError('');
    }
  }, [selectedSchedule]);

  const saveMutation = useMutation({
    mutationFn: (payload: InterviewScheduleRequest) => (
      selectedId == null
        ? interviewSchedulesApi.create(payload)
        : interviewSchedulesApi.update(selectedId, payload)
    ),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['interview-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['interview-schedules', saved.id] });
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setValidationError('');
    },
  });

  const timelineSegments = useMemo(() => computeTimeline(form.entries), [form.entries]);
  const hasAnyActivity = useMemo(() => (
    form.entries.some((entry) =>
      (entry.businessFunction ?? '').trim() !== ''
      || (entry.applicationsUsed ?? '').trim() !== ''
      || (entry.processImprovements ?? '').trim() !== ''
      || (entry.techIssuesToResolve ?? '').trim() !== ''
      || (entry.ticketRaised ?? '').trim() !== ''
    )
  ), [form.entries]);

  const updateEntry = (
    index: number,
    field: 'businessFunction' | 'applicationsUsed' | 'processImprovements' | 'techIssuesToResolve' | 'ticketRaised',
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      entries: current.entries.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.interviewDate) {
      setValidationError('Date is required.');
      return;
    }
    if (!hasAnyActivity) {
      setValidationError('Add at least one row with interview details.');
      return;
    }
    saveMutation.mutate(toPayload(form));
  };

  const createNewSheet = () => {
    setSelectedId(null);
    setForm(buildEmptyForm());
    setValidationError('');
  };

  if (isLoading && !isRefetching) return <LoadingSpinner message="Loading interview schedules..." />;
  if (error) {
    return (
      <ApiErrorState
        title="Failed to load interview schedules"
        error={error}
        onRetry={() => refetch()}
        fallbackMessage="Check backend is running and database is initialized."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Interview Work Schedule</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Sheet capture for interview findings from 08:00 to 21:00.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedId != null && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              Editing #{selectedId}
            </span>
          )}
          <button
            type="button"
            onClick={createNewSheet}
            className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
          >
            New Sheet
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="bg-amber-100 border-b border-amber-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-800">
                Business Area
                <input
                  type="text"
                  value={form.businessArea ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, businessArea: event.target.value }))}
                  className={metaInputClass}
                />
              </label>
              <label className="text-sm font-medium text-slate-800">
                PC Director
                <input
                  type="text"
                  value={form.pcDirector ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, pcDirector: event.target.value }))}
                  className={metaInputClass}
                />
              </label>
              <label className="text-sm font-medium text-slate-800">
                Product Controller
                <input
                  type="text"
                  value={form.productController ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, productController: event.target.value }))}
                  className={metaInputClass}
                />
              </label>
              <label className="text-sm font-medium text-slate-800">
                Named PnLs
                <input
                  type="text"
                  value={form.namedPnls ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, namedPnls: event.target.value }))}
                  className={metaInputClass}
                />
              </label>
              <label className="text-sm font-medium text-slate-800">
                Location
                <input
                  type="text"
                  value={form.location ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  className={metaInputClass}
                />
              </label>
              <label className="text-sm font-medium text-slate-800">
                Interviewed By
                <input
                  type="text"
                  value={form.interviewedBy ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, interviewedBy: event.target.value }))}
                  className={metaInputClass}
                />
              </label>
              <label className="text-sm font-medium text-slate-800 md:col-span-2">
                Date
                <input
                  type="date"
                  required
                  value={form.interviewDate}
                  onChange={(event) => setForm((current) => ({ ...current, interviewDate: event.target.value }))}
                  className="mt-1 w-full md:max-w-xs border border-amber-300 rounded-none px-2 py-2 text-sm bg-amber-50 focus:outline-none focus:bg-amber-100"
                />
              </label>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="w-[8%] px-2 py-2 text-left text-xs font-semibold border border-slate-600">Time</th>
                  <th className="w-[20%] px-2 py-2 text-left text-xs font-semibold border border-slate-600">Business Function / Activity</th>
                  <th className="w-[16%] px-2 py-2 text-left text-xs font-semibold border border-slate-600">Applications Used</th>
                  <th className="w-[20%] px-2 py-2 text-left text-xs font-semibold border border-slate-600">Process Improvements</th>
                  <th className="w-[22%] px-2 py-2 text-left text-xs font-semibold border border-slate-600">Tech Issues to Resolve</th>
                  <th className="w-[14%] px-2 py-2 text-left text-xs font-semibold border border-slate-600">Ticket Raised</th>
                </tr>
              </thead>
              <tbody>
                {form.entries.map((entry, index) => (
                  <tr key={entry.timeSlot}>
                    <td className="border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 bg-amber-50">{entry.timeSlot}</td>
                    <td className="border border-slate-300 p-0">
                      <input
                        type="text"
                        value={entry.businessFunction ?? ''}
                        onChange={(event) => updateEntry(index, 'businessFunction', event.target.value)}
                        className={sheetInputClass}
                        placeholder="Enter work activity"
                      />
                    </td>
                    <td className="border border-slate-300 p-0">
                      <input
                        type="text"
                        value={entry.applicationsUsed ?? ''}
                        onChange={(event) => updateEntry(index, 'applicationsUsed', event.target.value)}
                        className={sheetInputClass}
                        placeholder="e.g. SAP, FinPortal"
                      />
                    </td>
                    <td className="border border-slate-300 p-0">
                      <input
                        type="text"
                        value={entry.processImprovements ?? ''}
                        onChange={(event) => updateEntry(index, 'processImprovements', event.target.value)}
                        className={sheetInputClass}
                        placeholder="Improvement opportunities"
                      />
                    </td>
                    <td className="border border-slate-300 p-0">
                      <input
                        type="text"
                        value={entry.techIssuesToResolve ?? ''}
                        onChange={(event) => updateEntry(index, 'techIssuesToResolve', event.target.value)}
                        className={sheetInputClass}
                        placeholder="Open technical issues"
                      />
                    </td>
                    <td className="border border-slate-300 p-0">
                      <input
                        type="text"
                        value={entry.ticketRaised ?? ''}
                        onChange={(event) => updateEntry(index, 'ticketRaised', event.target.value)}
                        className={sheetInputClass}
                        placeholder="Ticket ID / Yes-No"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Timeline View</h2>
            <span className="text-xs text-slate-500">08:00 to 21:00</span>
          </div>

          <div className="relative h-16 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            {timelineSegments.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                Add activities in the sheet to render timeline
              </div>
            ) : (
              timelineSegments.map((segment, index) => (
                <div
                  key={`${segment.startSlot}-${segment.endSlot}-${segment.label}-${index}`}
                  className={`absolute top-2 h-12 rounded-md text-white text-xs font-medium px-2 py-1 overflow-hidden ${SEGMENT_COLORS[index % SEGMENT_COLORS.length]}`}
                  style={{
                    left: `${(segment.startIndex / TIME_SLOTS.length) * 100}%`,
                    width: `${(segment.span / TIME_SLOTS.length) * 100}%`,
                  }}
                  title={`${segment.startSlot} - ${segment.endSlot}: ${segment.label}`}
                >
                  <div className="truncate">{segment.label}</div>
                  <div className="opacity-80">{segment.startSlot} - {segment.endSlot}</div>
                </div>
              ))
            )}
          </div>

          <div className="grid gap-1 text-[10px] text-slate-500" style={{ gridTemplateColumns: `repeat(${TIME_SLOTS.length}, minmax(0, 1fr))` }}>
            {TIME_SLOTS.map((slot) => (
              <span key={slot} className="text-center">{slot}</span>
            ))}
          </div>

          {timelineSegments.length > 0 && (
            <div className="rounded-lg border border-slate-200 p-3 space-y-1">
              {timelineSegments.map((segment, index) => (
                <p key={`summary-${segment.startSlot}-${index}`} className="text-sm text-slate-700">
                  <span className="font-semibold">{segment.startSlot} - {segment.endSlot}:</span> {segment.label}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending || isLoadingSelected}
            className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : selectedId == null ? 'Save Interview Sheet' : 'Update Interview Sheet'}
          </button>
          {isLoadingSelected && <span className="text-sm text-slate-500">Loading selected schedule...</span>}
          {validationError && <span className="text-sm text-rose-600">{validationError}</span>}
        </div>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Saved Interviews</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Business Area</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Controller</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interviewed By</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  className={`cursor-pointer hover:bg-slate-50 ${selectedId === schedule.id ? 'bg-sky-50' : ''}`}
                  onClick={() => setSelectedId(schedule.id)}
                >
                  <td className="px-4 py-2 text-sm text-gray-700">{schedule.interviewDate ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{schedule.businessArea ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{schedule.productController ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{schedule.location ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{schedule.interviewedBy ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{schedule.updatedDate?.replace('T', ' ').slice(0, 16) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {schedules.length === 0 && (
            <p className="px-4 py-8 text-center text-gray-500">No interview schedules yet. Create one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
