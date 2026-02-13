import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '../shared/api/applicationsApi';
import { usersApi } from '../shared/api/usersApi';
import { getApiErrorMessage } from '../shared/utils/apiError';
import SearchableSelect from './SearchableSelect';
import type { CreateFastProblemRequest, UpdateFastProblemRequest, RegionalCode, TicketStatus } from '../shared/types';

interface TicketFormProps {
    initialData?: Partial<CreateFastProblemRequest & UpdateFastProblemRequest>;
    mode?: 'create' | 'edit';
    /** When provided in edit mode, BTB Tech Lead field is shown once ticket is ASSIGNED or later. */
    ticketStatus?: TicketStatus;
    onSubmit: (data: CreateFastProblemRequest | UpdateFastProblemRequest) => void;
    isLoading?: boolean;
}

const ASSIGNED_OR_LATER: TicketStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'ROOT_CAUSE_IDENTIFIED', 'FIX_IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function TicketForm({ initialData, mode = 'create', ticketStatus, onSubmit, isLoading }: TicketFormProps) {
    const [formData, setFormData] = useState<CreateFastProblemRequest & Partial<UpdateFastProblemRequest>>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        servicenowIncidentNumber: initialData?.servicenowIncidentNumber || '',
        servicenowProblemNumber: initialData?.servicenowProblemNumber || '',
        pbtId: initialData?.pbtId || '',
        userImpactCount: initialData?.userImpactCount || 0,
        affectedApplication: initialData?.affectedApplication || '',
        requestNumber: initialData?.requestNumber || '',
        applicationIds: initialData?.applicationIds ?? [],
        regionalCodes: initialData?.regionalCodes?.length ? initialData.regionalCodes : ['AMER'],
        targetResolutionHours: initialData?.targetResolutionHours || 48,
        priority: initialData?.priority ?? 3,
        anticipatedBenefits: initialData?.anticipatedBenefits || '',
        assignedTo: initialData?.assignedTo || '',
        assignmentGroup: initialData?.assignmentGroup || '',
        btbTechLeadUsername: initialData?.btbTechLeadUsername ?? '',
        rootCause: initialData?.rootCause || '',
        workaround: initialData?.workaround || '',
        permanentFix: initialData?.permanentFix || '',
        confluenceLink: initialData?.confluenceLink || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'userImpactCount' || name === 'targetResolutionHours' || name === 'priority' ? parseInt(value) || 0 : value
        }));
    };

    const buildSubmitData = (): CreateFastProblemRequest | UpdateFastProblemRequest => {
        const base = {
            title: formData.title,
            description: formData.description || undefined,
            servicenowIncidentNumber: formData.servicenowIncidentNumber || undefined,
            servicenowProblemNumber: formData.servicenowProblemNumber || undefined,
            userImpactCount: formData.userImpactCount,
            affectedApplication: formData.affectedApplication || undefined,
            requestNumber: formData.requestNumber || undefined,
            applicationIds: formData.applicationIds?.length ? formData.applicationIds : undefined,
            anticipatedBenefits: formData.anticipatedBenefits || undefined,
            regionalCodes: formData.regionalCodes,
            targetResolutionHours: formData.targetResolutionHours,
            priority: formData.priority,
            assignedTo: formData.assignedTo || undefined,
            assignmentGroup: formData.assignmentGroup || undefined,
            btbTechLeadUsername: formData.btbTechLeadUsername?.trim() || undefined,
        };
        if (mode === 'edit') {
            return {
                ...base,
                btbTechLeadUsername: formData.btbTechLeadUsername?.trim() ?? '',
                rootCause: formData.rootCause || undefined,
                workaround: formData.workaround || undefined,
                permanentFix: formData.permanentFix || undefined,
                confluenceLink: formData.confluenceLink?.trim() ?? '',
            };
        }
        return { ...base, pbtId: formData.pbtId || undefined, confluenceLink: formData.confluenceLink?.trim() || undefined, regionalCodes: formData.regionalCodes } as CreateFastProblemRequest;
    };

    const [benefitsError, setBenefitsError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'create' && !formData.anticipatedBenefits?.trim()) {
            setBenefitsError('Benefits justification is required to generate a FAST ID.');
            return;
        }
        setBenefitsError(null);
        onSubmit(buildSubmitData());
    };

    const regions: RegionalCode[] = ['APAC', 'EMEA', 'AMER'];

    const { data: applications = [], error: applicationsError, refetch: refetchApplications } = useQuery({
        queryKey: ['applications'],
        queryFn: () => applicationsApi.list(),
        retry: 2,
    });

    const showBtbTechLead = mode === 'edit' && ticketStatus && ASSIGNED_OR_LATER.includes(ticketStatus);
    const applicationIdsForTechLeads = formData.applicationIds?.length ? formData.applicationIds : undefined;
    const { data: techLeads = [] } = useQuery({
        queryKey: ['users', 'tech-leads', applicationIdsForTechLeads ?? []],
        queryFn: () => usersApi.listTechLeads(applicationIdsForTechLeads),
        enabled: showBtbTechLead,
    });

    const toggleApplication = (appId: number) => {
        setFormData(prev => {
            const current = prev.applicationIds ?? [];
            const has = current.includes(appId);
            const next = has ? current.filter(id => id !== appId) : [...current, appId];
            return { ...prev, applicationIds: next };
        });
    };

    const toggleRegion = (r: RegionalCode) => {
        setFormData(prev => {
            const current = prev.regionalCodes || [];
            const has = current.includes(r);
            const next = has ? current.filter(c => c !== r) : [...current, r];
            return next.length ? { ...prev, regionalCodes: next } : { ...prev, regionalCodes: current };
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800/80 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-600">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Title */}
                <div className="sm:col-span-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-slate-300 dark:text-slate-300">Title</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Description</label>
                    <div className="mt-1">
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        />
                    </div>
                </div>

                {/* Regions (multi-select) */}
                <div className="sm:col-span-2">
                    <span className="block text-sm font-medium text-gray-700 dark:text-slate-300">Regions</span>
                    <div className="mt-1 flex flex-wrap gap-3">
                        {regions.map(r => (
                            <label key={r} className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(formData.regionalCodes || []).includes(r)}
                                    onChange={() => toggleRegion(r)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700 dark:text-slate-300">{r}</span>
                            </label>
                        ))}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">At least one region required</p>
                </div>

                {/* Impact */}
                <div className="sm:col-span-2">
                    <label htmlFor="userImpactCount" className="block text-sm font-medium text-gray-700 dark:text-slate-300">User Impact Count</label>
                    <div className="mt-1">
                        <input
                            type="number"
                            name="userImpactCount"
                            id="userImpactCount"
                            min="0"
                            value={formData.userImpactCount}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* Priority 1-5 */}
                <div className="sm:col-span-2">
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Priority (1-5)</label>
                    <div className="mt-1">
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        >
                            {[1, 2, 3, 4, 5].map((p) => (
                                <option key={p} value={p}>{p} {p === 1 ? '(Lowest)' : p === 5 ? '(Highest)' : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Target Hours */}
                <div className="sm:col-span-2">
                    <label htmlFor="targetResolutionHours" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Target Resolution (Hours)</label>
                    <div className="mt-1">
                        <input
                            type="number"
                            name="targetResolutionHours"
                            id="targetResolutionHours"
                            min="1"
                            value={formData.targetResolutionHours}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* INC # */}
                <div className="sm:col-span-3">
                    <label htmlFor="servicenowIncidentNumber" className="block text-sm font-medium text-gray-700 dark:text-slate-300">ServiceNow Incident #</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="servicenowIncidentNumber"
                            id="servicenowIncidentNumber"
                            placeholder="INC..."
                            value={formData.servicenowIncidentNumber}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* PRB # */}
                <div className="sm:col-span-3">
                    <label htmlFor="servicenowProblemNumber" className="block text-sm font-medium text-gray-700 dark:text-slate-300">ServiceNow Problem #</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="servicenowProblemNumber"
                            id="servicenowProblemNumber"
                            placeholder="PRB..."
                            value={formData.servicenowProblemNumber}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* Affected App (legacy free text) */}
                <div className="sm:col-span-3">
                    <label htmlFor="affectedApplication" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Main Affected Application (text)</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="affectedApplication"
                            id="affectedApplication"
                            value={formData.affectedApplication}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                            placeholder="Optional"
                        />
                    </div>
                </div>

                {/* Request number (e.g. fix to prod tracking) */}
                <div className="sm:col-span-3">
                    <label htmlFor="requestNumber" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Request number</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="requestNumber"
                            id="requestNumber"
                            value={formData.requestNumber || ''}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                            placeholder="e.g. CHG0012345"
                        />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Tracking number for fix to prod / closing</p>
                </div>

                {/* Impacted applications: multi-select from configured applications */}
                <div className="sm:col-span-6">
                    <span className="block text-sm font-medium text-gray-700 dark:text-slate-300 dark:text-slate-300">Impacted applications</span>
                    <p className="text-xs text-gray-500 dark:text-slate-400 dark:text-slate-400 mt-0.5">Select all applications impacted by this ticket (from Admin → Applications).</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                        {applications.map((app) => {
                            const selected = (formData.applicationIds ?? []).includes(app.id);
                            return (
                                <label key={app.id} className="inline-flex items-center gap-2 cursor-pointer rounded border border-gray-200 dark:border-slate-600 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => toggleApplication(app.id)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-slate-300 dark:text-slate-300">{app.name}{app.code ? ` (${app.code})` : ''}</span>
                                </label>
                            );
                        })}
                        {applications.length === 0 && !applicationsError && (
                            <span className="text-sm text-gray-500 dark:text-slate-400 dark:text-slate-400">No applications configured. Add them in Admin → Applications.</span>
                        )}
                        {applicationsError && (
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-amber-600 dark:text-amber-400">Could not load application list.</span>
                                <span className="text-xs text-gray-500 dark:text-slate-400">{getApiErrorMessage(applicationsError, 'Request failed')}</span>
                                <button type="button" onClick={() => refetchApplications()} className="text-sm text-primary hover:underline text-left">
                                    Retry loading applications
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Confluence Link */}
                <div className="sm:col-span-6">
                    <label htmlFor="confluenceLink" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Confluence Link</label>
                    <div className="mt-1">
                        <input
                            type="url"
                            name="confluenceLink"
                            id="confluenceLink"
                            placeholder="https://confluence.example.com/..."
                            value={formData.confluenceLink}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Link for further details (audited when changed)</p>
                </div>

                {/* Assignment Group */}
                <div className="sm:col-span-3">
                    <label htmlFor="assignmentGroup" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Assignment Group</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="assignmentGroup"
                            id="assignmentGroup"
                            placeholder="Optional - Auto-assigned if empty"
                            value={formData.assignmentGroup}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-500 rounded-md p-2 border bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* BTB Tech Lead (edit only, once ticket is ASSIGNED or later) */}
                {showBtbTechLead && (
                    <div className="sm:col-span-3">
                        <SearchableSelect
                            label="BTB Tech Lead"
                            id="btbTechLeadUsername"
                            value={formData.btbTechLeadUsername ?? ''}
                            onChange={(v) => setFormData((prev) => ({ ...prev, btbTechLeadUsername: v }))}
                            options={techLeads.map((u) => ({
                                value: u.username,
                                label: u.fullName ?? u.username,
                                subLabel: u.username,
                            }))}
                            placeholder="Search by name or username..."
                            emptyMessage="No tech leads match"
                            className="w-full"
                        />
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Reference assignee once all approvals are done</p>
                    </div>
                )}

                {/* Benefits form – required for FAST ID (Finance Chennai PC & FC) */}
                <div className="sm:col-span-6">
                    <label htmlFor="anticipatedBenefits" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Benefits justification <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Required to generate a FAST ID. Describe impact on P&amp;L timeliness, daily efficiency or controls, and rank/priority as applicable.
                    </p>
                    <div className="mt-1">
                        <textarea
                            id="anticipatedBenefits"
                            name="anticipatedBenefits"
                            rows={3}
                            value={formData.anticipatedBenefits}
                            onChange={(e) => { handleChange(e); setBenefitsError(null); }}
                            required={mode === 'create'}
                            className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border rounded-md p-2 ${
                                benefitsError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-slate-500'
                            }`}
                            placeholder="e.g. Delays P&L close by 2 days; high impact on controls; rank 1."
                        />
                        {benefitsError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{benefitsError}</p>}
                    </div>
                </div>

                {mode === 'edit' && (
                    <>
                        <div className="sm:col-span-6">
                            <label htmlFor="rootCause" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Root Cause</label>
                            <div className="mt-1">
                                <textarea id="rootCause" name="rootCause" rows={3} value={formData.rootCause || ''} onChange={handleChange}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2" />
                            </div>
                        </div>
                        <div className="sm:col-span-6">
                            <label htmlFor="workaround" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Workaround</label>
                            <div className="mt-1">
                                <textarea id="workaround" name="workaround" rows={3} value={formData.workaround || ''} onChange={handleChange}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2" />
                            </div>
                        </div>
                        <div className="sm:col-span-6">
                            <label htmlFor="permanentFix" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Permanent Fix</label>
                            <div className="mt-1">
                                <textarea id="permanentFix" name="permanentFix" rows={3} value={formData.permanentFix || ''} onChange={handleChange}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                    {isLoading ? 'Saving...' : mode === 'edit' ? 'Update Ticket' : 'Save Ticket'}
                </button>
            </div>
        </form>
    );
}
