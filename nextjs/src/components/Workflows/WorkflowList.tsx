'use Client'
import React, { useState, useMemo } from 'react';
import WorkflowModal from '@/components/Workflows/WorkflowModal';
import ExecuteWorkflowModal from './ExecuteWorkflowModal';
import useModal from '@/hooks/common/useModal';
import AlertDialogConfirmation from '../AlertDialogConfirmation';
import { getCurrentUser } from '@/utils/handleAuth';
import { ROLE_TYPE } from '@/utils/constant';
import Link from 'next/link';
import RemoveIcon from '@/icons/RemoveIcon';
import PencilIcon from '@/icons/PencilIcon';
import { WorkflowType } from '@/types/brain';
import { PaginatorType } from '@/types/common';
import { LoadMorePagination } from '../Shared/PaginationControl';

type WorkflowListProps = {
    loading: boolean;
    workflowList: WorkflowType[];
    paginator: PaginatorType;
    handlePagination: () => void;
    deleteWorkflow: (id: string) => void;
    updateWorkflow: (payload: any, closeModal: any, id: string) => void;
    syncWorkflows: (brainId: string) => void;
    executeWorkflow: (id: string, params: any) => Promise<any>;
    brainId?: string;
}

const WorkflowList: React.FC<WorkflowListProps> = ({
    loading,
    workflowList,
    paginator,
    handlePagination,
    deleteWorkflow,
    updateWorkflow,
    syncWorkflows,
    executeWorkflow,
    brainId
}) => {
    const { isOpen: isEdit, openModal, closeModal } = useModal();
    const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const [activeWorkflowIndex, setActiveWorkflowIndex] = React.useState<number | null>(null);

    const handleOpenWorkflowModal = (index: number) => {
        setActiveWorkflowIndex(index);
        openModal();
    };
    const [deleteItem, setDeleteItem] = useState<WorkflowType | null>(null);
    const handleDeleteWorkflow = () => {
        if (deleteItem) {
            deleteWorkflow(deleteItem._id);
            setDeleteItem(null);
        }
        closeDeleteModal();
    }

    const [isExecuteOpen, setIsExecuteOpen] = useState(false);
    const [executionTarget, setExecutionTarget] = useState<WorkflowType | null>(null);

    const handleOpenExecute = (workflow: WorkflowType) => {
        setExecutionTarget(workflow);
        setIsExecuteOpen(true);
    }
    const handleCloseExecute = () => {
        setIsExecuteOpen(false);
        setExecutionTarget(null);
    }

    const currentUser = useMemo(() => getCurrentUser(), []);

    const handleSync = () => {
        if (brainId) syncWorkflows(brainId);
    }

    return <>

        <div className={`prompts-items prompts-items-list grid grid-cols-1 gap-2.5 w-full`}>
            {workflowList.length > 0 && workflowList.map((item: WorkflowType, index: number) => (
                <div key={item._id} className='group/item md:hover:bg-b5 bg-gray-100 border prompts-item-detail rounded-lg py-3 px-5 gap-2.5 w-full transition duration-150 ease-in-out'>
                    <div className='prompts-item-heading relative flex gap-2.5 w-full'>
                        <div className={`prompts-item-title-tag relative flex flex-wrap gap-2.5 items-center`}>
                            <h5 className='text-font-14 font-semibold text-b2 transition duration-150 ease-in-out md:group-hover/item:text-b15'>
                                {item.name}
                            </h5>
                            {item.trigger?.value && (
                                <span className="inline-block whitespace-nowrap rounded-sm bg-b11 px-2 py-[4px] text-center align-baseline text-font-12 font-normal leading-none text-b5 md:group-hover/item:bg-b15/10 md:group-hover/item:text-b15 transition duration-150 ease-in-out">
                                    #{item.trigger.value}
                                </span>
                            )}
                        </div>

                        <div className='ml-auto flex items-center gap-2.5'>
                            {((currentUser.roleCode == ROLE_TYPE.USER && item.user.id == currentUser._id) ||
                                (currentUser.roleCode != ROLE_TYPE.USER)) && (
                                    <>
                                        <Link
                                            href={'#'}
                                            onClick={() => {
                                                setDeleteItem(item);
                                                openDeleteModal();
                                            }}
                                            className="group-hover/item:opacity-100 md:opacity-0 rounded bg-white flex items-center justify-center w-6 min-w-6 h-6 p-0.5 [&>svg]:w-[11] [&>svg]:h-[11] [&>svg]:fill-b5"
                                        >
                                            <RemoveIcon width={14} height={14} className="" />
                                        </Link>
                                        {/* <Link
                                            href={'#'}
                                            onClick={() => {
                                                handleOpenWorkflowModal(index)
                                            }}
                                            className="group-hover/item:opacity-100 md:opacity-0 rounded bg-white flex items-center justify-center w-6 min-w-6 h-6 p-0.5 [&>svg]:w-[11] [&>svg]:h-[11] [&>svg]:fill-b5"
                                        >
                                            <PencilIcon width={11} height={11} />
                                        </Link> */}
                                    </>
                                )}
                           
                        </div>

                        {isEdit && index === activeWorkflowIndex && <WorkflowModal open={openModal} closeModal={closeModal} edit={item} updateWorkflow={updateWorkflow} />}
                    </div>
                    <div className='overflow-y-auto max-h-80'>
                        <p className='text-font-12 text-b5 mt-2.5 md:group-hover/item:text-b15 transition duration-150 ease-in-out'>
                            {item.description}
                        </p>
                    </div>
                </div>
            ))}

            {loading && <div className="text-center py-4">Loading...</div>}

            {isDeleteOpen && (
                <AlertDialogConfirmation
                    description={
                        `Are you sure you want to delete ${deleteItem?.name} ?`
                    }
                    btntext={'Sure'}
                    btnclassName={'btn-red'}
                    open={openDeleteModal}
                    closeModal={closeDeleteModal}
                    handleDelete={handleDeleteWorkflow}
                    id={deleteItem?._id}
                />
            )}

            {isExecuteOpen && executionTarget && (
                <ExecuteWorkflowModal
                    open={isExecuteOpen}
                    closeModal={handleCloseExecute}
                    workflow={executionTarget}
                    executeWorkflow={executeWorkflow}
                />
            )}
        </div>
        <LoadMorePagination isLoading={loading} handlePagination={handlePagination} paginator={paginator} />
    </>
}

export default WorkflowList;
