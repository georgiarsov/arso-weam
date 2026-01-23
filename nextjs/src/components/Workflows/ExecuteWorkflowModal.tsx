import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { WorkflowType } from '@/types/brain';
// import Loader from '../Shared/Loader'; // If available or ThreeDotLoader

const ExecuteWorkflowModal = ({
    open,
    closeModal,
    workflow,
    executeWorkflow
}: {
    open: boolean,
    closeModal: () => void,
    workflow: WorkflowType | null,
    executeWorkflow: (id: string, params: any) => Promise<any>
}) => {
    const [params, setParams] = useState('{\n  \n}');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRun = async () => {
        if (!workflow) return;
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            let parsedParams = {};
            try {
                parsedParams = JSON.parse(params);
            } catch (e) {
                setError("Invalid JSON parameters");
                setLoading(false);
                return;
            }

            const res = await executeWorkflow(workflow._id, parsedParams);
            setResult(res);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Execution failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={closeModal}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 [&>button]:right-5 [&>button]:top-5 [&>button]:bg-[#F6F6F6] [&>button]:p-[7px] [&>button]:rounded-full [&>button]:opacity-100 [&>button>svg]:w-[10px] [&>button>svg]:h-[10px]">
                <DialogHeader className='flex flex-row items-center justify-between space-y-0 px-[30px] py-5'>
                    <DialogTitle className="text-xl font-semibold text-b2">
                        Execute Workflow: {workflow?.name}
                    </DialogTitle>
                </DialogHeader>

                <Separator className='h-[1px] bg-[#EAEAEA]' />

                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Input Parameters (JSON)</label>
                        <textarea
                            className="w-full h-32 p-3 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                            value={params}
                            onChange={(e) => setParams(e.target.value)}
                            placeholder="{}"
                        />
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>

                    {result && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
                            <div className="bg-gray-900 text-green-400 p-4 rounded-md overflow-auto max-h-60 font-mono text-xs">
                                <pre>{JSON.stringify(result, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-end gap-2.5 px-[30px] pb-[30px]">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={handleRun}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Running...' : 'Execute'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExecuteWorkflowModal;
