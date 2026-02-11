import { useState } from 'react';
import type { CreateFastProblemRequest, UpdateFastProblemRequest, RegionalCode } from '../shared/types';

interface TicketFormProps {
    initialData?: Partial<CreateFastProblemRequest & UpdateFastProblemRequest>;
    mode?: 'create' | 'edit';
    onSubmit: (data: CreateFastProblemRequest | UpdateFastProblemRequest) => void;
    isLoading?: boolean;
}

export default function TicketForm({ initialData, mode = 'create', onSubmit, isLoading }: TicketFormProps) {
    const [formData, setFormData] = useState<CreateFastProblemRequest & Partial<UpdateFastProblemRequest>>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        servicenowIncidentNumber: initialData?.servicenowIncidentNumber || '',
        servicenowProblemNumber: initialData?.servicenowProblemNumber || '',
        pbtId: initialData?.pbtId || '',
        userImpactCount: initialData?.userImpactCount || 0,
        affectedApplication: initialData?.affectedApplication || '',
        regionalCode: (initialData?.regionalCode as RegionalCode) || 'USDS',
        targetResolutionHours: initialData?.targetResolutionHours || 48,
        priority: initialData?.priority ?? 3,
        anticipatedBenefits: initialData?.anticipatedBenefits || '',
        assignedTo: initialData?.assignedTo || '',
        assignmentGroup: initialData?.assignmentGroup || '',
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
            anticipatedBenefits: formData.anticipatedBenefits || undefined,
            regionalCode: formData.regionalCode,
            targetResolutionHours: formData.targetResolutionHours,
            priority: formData.priority,
            assignedTo: formData.assignedTo || undefined,
            assignmentGroup: formData.assignmentGroup || undefined,
        };
        if (mode === 'edit') {
            return {
                ...base,
                rootCause: formData.rootCause || undefined,
                workaround: formData.workaround || undefined,
                permanentFix: formData.permanentFix || undefined,
                confluenceLink: formData.confluenceLink?.trim() ?? '',
            };
        }
        return { ...base, pbtId: formData.pbtId || undefined, confluenceLink: formData.confluenceLink?.trim() || undefined } as CreateFastProblemRequest;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(buildSubmitData());
    };

    const regions: RegionalCode[] = ['USDS', 'UM', 'JPL', 'CHN'];

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Title */}
                <div className="sm:col-span-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
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

                {/* Region */}
                <div className="sm:col-span-2">
                    <label htmlFor="regionalCode" className="block text-sm font-medium text-gray-700">Region</label>
                    <div className="mt-1">
                        <select
                            id="regionalCode"
                            name="regionalCode"
                            value={formData.regionalCode}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        >
                            {regions.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Impact */}
                <div className="sm:col-span-2">
                    <label htmlFor="userImpactCount" className="block text-sm font-medium text-gray-700">User Impact Count</label>
                    <div className="mt-1">
                        <input
                            type="number"
                            name="userImpactCount"
                            id="userImpactCount"
                            min="0"
                            value={formData.userImpactCount}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Priority 1-5 */}
                <div className="sm:col-span-2">
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority (1-5)</label>
                    <div className="mt-1">
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        >
                            {[1, 2, 3, 4, 5].map((p) => (
                                <option key={p} value={p}>{p} {p === 1 ? '(Lowest)' : p === 5 ? '(Highest)' : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Target Hours */}
                <div className="sm:col-span-2">
                    <label htmlFor="targetResolutionHours" className="block text-sm font-medium text-gray-700">Target Resolution (Hours)</label>
                    <div className="mt-1">
                        <input
                            type="number"
                            name="targetResolutionHours"
                            id="targetResolutionHours"
                            min="1"
                            value={formData.targetResolutionHours}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* INC # */}
                <div className="sm:col-span-3">
                    <label htmlFor="servicenowIncidentNumber" className="block text-sm font-medium text-gray-700">ServiceNow Incident #</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="servicenowIncidentNumber"
                            id="servicenowIncidentNumber"
                            placeholder="INC..."
                            value={formData.servicenowIncidentNumber}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* PRB # */}
                <div className="sm:col-span-3">
                    <label htmlFor="servicenowProblemNumber" className="block text-sm font-medium text-gray-700">ServiceNow Problem #</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="servicenowProblemNumber"
                            id="servicenowProblemNumber"
                            placeholder="PRB..."
                            value={formData.servicenowProblemNumber}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Affected App */}
                <div className="sm:col-span-3">
                    <label htmlFor="affectedApplication" className="block text-sm font-medium text-gray-700">Affected Application</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="affectedApplication"
                            id="affectedApplication"
                            value={formData.affectedApplication}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Confluence Link */}
                <div className="sm:col-span-6">
                    <label htmlFor="confluenceLink" className="block text-sm font-medium text-gray-700">Confluence Link</label>
                    <div className="mt-1">
                        <input
                            type="url"
                            name="confluenceLink"
                            id="confluenceLink"
                            placeholder="https://confluence.example.com/..."
                            value={formData.confluenceLink}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">Link for further details (audited when changed)</p>
                </div>

                {/* Assignment Group */}
                <div className="sm:col-span-3">
                    <label htmlFor="assignmentGroup" className="block text-sm font-medium text-gray-700">Assignment Group</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="assignmentGroup"
                            id="assignmentGroup"
                            placeholder="Optional - Auto-assigned if empty"
                            value={formData.assignmentGroup}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Benefits */}
                <div className="sm:col-span-6">
                    <label htmlFor="anticipatedBenefits" className="block text-sm font-medium text-gray-700">Anticipated Benefits</label>
                    <div className="mt-1">
                        <textarea
                            id="anticipatedBenefits"
                            name="anticipatedBenefits"
                            rows={2}
                            value={formData.anticipatedBenefits}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        />
                    </div>
                </div>

                {mode === 'edit' && (
                    <>
                        <div className="sm:col-span-6">
                            <label htmlFor="rootCause" className="block text-sm font-medium text-gray-700">Root Cause</label>
                            <div className="mt-1">
                                <textarea id="rootCause" name="rootCause" rows={3} value={formData.rootCause || ''} onChange={handleChange}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2" />
                            </div>
                        </div>
                        <div className="sm:col-span-6">
                            <label htmlFor="workaround" className="block text-sm font-medium text-gray-700">Workaround</label>
                            <div className="mt-1">
                                <textarea id="workaround" name="workaround" rows={3} value={formData.workaround || ''} onChange={handleChange}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2" />
                            </div>
                        </div>
                        <div className="sm:col-span-6">
                            <label htmlFor="permanentFix" className="block text-sm font-medium text-gray-700">Permanent Fix</label>
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
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Saving...' : mode === 'edit' ? 'Update Ticket' : 'Save Ticket'}
                </button>
            </div>
        </form>
    );
}
