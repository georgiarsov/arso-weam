'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import SearchIcon from '@/icons/Search';
import WorkflowList from '@/components/Workflows/WorkflowList';
import useWorkflow from '@/hooks/workflow/useWorkflow';
import useSearch from '@/hooks/common/useSearch';
import { useSearchParams } from 'next/navigation';
import NoResultFound from '../NoResult/NoResultFound';

export default function WorkflowItems() {
    const searchParams = useSearchParams();
    const brainId = searchParams.get('b');

    const { getList, loading, workflowList, setWorkflowList, paginator, deleteWorkflow, updateWorkflow, syncWorkflows, executeWorkflow } = useWorkflow(brainId || undefined);

    const { searchValue, setSearchValue } = useSearch({
        func: getList,
        delay: 500,
        dependency: [brainId],
        resetState: () => setWorkflowList([])
    });

    const handlePagination = useCallback(() => {
        if (paginator?.hasNextPage && paginator?.offset !== undefined && paginator?.perPage !== undefined) {
            const nextOffset = paginator.offset + paginator.perPage;
            getList(searchValue, {}, { offset: nextOffset, limit: paginator.perPage });
        }
    }, [paginator, searchValue, getList]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        getList(searchValue);
    }, []);

    useEffect(() => {
        if (brainId) getList(searchValue);
    }, [brainId]);


    return (
        <div className="flex flex-col flex-1 h-full">
            <div className="flex flex-col flex-1 relative h-full overflow-hidden">
                <div className="relative flex flex-col h-full overflow-hidden px-3">
                    <div className="flex items-center min-w-80 flex-wrap gap-2.5 max-w-[950px] w-full mx-auto my-5 px-5 flex-col md:flex-row">
                        <div className="search-docs relative flex-1 max-md:w-full">
                            <input
                                type="text"
                                className="default-form-input default-form-input-md !border-b10 focus:!border-b2 !pl-10"
                                placeholder="Search Workflows"
                                onChange={handleChange}
                                value={searchValue}
                            />
                            <span className="inline-block absolute left-[15px] top-1/2 -translate-y-1/2 [&>svg]:fill-b7">
                                <SearchIcon className="w-4 h-[17px] fill-b7" />
                            </span>
                        </div>

                      
                    </div>

                    <div className='h-full overflow-y-auto w-full relative pb-[120px]'>
                        <div className='max-w-[950px] mx-auto px-5'>
                            <WorkflowList
                                loading={loading}
                                workflowList={workflowList}
                                paginator={paginator}
                                handlePagination={handlePagination}
                                deleteWorkflow={deleteWorkflow}
                                updateWorkflow={updateWorkflow}
                                syncWorkflows={syncWorkflows}
                                executeWorkflow={executeWorkflow}
                                brainId={brainId || undefined}
                            />

                            {
                                workflowList.length === 0 && !loading && (
                                    <NoResultFound message={searchValue ? "Search results not found." : "No workflows yet. Ask AI to create a workflow in the chat."} />
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
