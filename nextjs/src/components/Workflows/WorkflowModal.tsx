'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Label from '@/widgets/Label';
import { yupResolver } from '@hookform/resolvers/yup';
import { workflowCreateSchema } from '@/schema/workflow';
import { useForm } from 'react-hook-form';
import useWorkflow from '@/hooks/workflow/useWorkflow';
import { retrieveBrainData } from '@/utils/helper';
import ValidationError from '@/widgets/ValidationError';
import { useSelector } from 'react-redux';
import CommonSelectInput from '@/widgets/CommonSelectInput';
import { Separator } from '../ui/separator';
import { WorkflowType } from '@/types/brain';

const WorkflowModal = ({ open, closeModal, edit, updateWorkflow, setWorkflowState, prefill }: { open: any, closeModal: any, edit?: WorkflowType, updateWorkflow?: any, setWorkflowState?: any, prefill?: Partial<WorkflowType> }) => {

    const { createWorkflow, loading } = useWorkflow();
    const combined = useSelector((store: any) => store.brain.combined);

    const customSelectStyles = {
        menu: (provided) => ({
            ...provided,
            zIndex: 1000,
            position: 'absolute',
        }),
        menuList: (provided) => ({
            ...provided,
            maxHeight: '150px',
            overflowY: 'auto',
        }),
    };

    let selectedBrain: any[] = [];
    const braindata = retrieveBrainData();
    if (edit) {
        selectedBrain.push({
            value: edit.brain.title,
            label: edit.brain.title,
            slug: edit.brain.slug,
            id: edit.brain.id
        });
    } else if (prefill?.brain) {
        // If prefill has brain info (might be partial)
        // Assuming prefill brain matches structure or is just ID?
        // For now, default to current brain if prefill doesn't have full brain obj
        if (braindata) {
            selectedBrain.push({
                value: braindata.title,
                label: braindata.title,
                id: braindata._id,
                slug: braindata.slug
            });
        }
    } else if (braindata) {
        selectedBrain.push({
            value: braindata.title,
            label: braindata.title,
            id: braindata._id,
            slug: braindata.slug
        });
    }

    const defaultValues: any = {
        name: edit?.name || prefill?.name || '',
        description: edit?.description || prefill?.description || '',
        brain: selectedBrain,
        n8nWorkflowId: edit?.n8nWorkflowId || prefill?.n8nWorkflowId || '',
        triggerType: edit?.trigger?.type || prefill?.trigger?.type || 'manual',
        triggerValue: edit?.trigger?.value || prefill?.trigger?.value || '',
    };

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        defaultValues: defaultValues,
        resolver: yupResolver(workflowCreateSchema),
    });

    const processForm = async (payload) => {
        const data = {
            name: payload.name,
            description: payload.description,
            selected: payload.brain[0]?.id || braindata._id,
            trigger: {
                type: payload.triggerType,
                value: payload.triggerValue
            },
            n8nWorkflowId: payload.n8nWorkflowId,
            isPrivate: true
        }

        if (edit && updateWorkflow) {
            await updateWorkflow(data, closeModal, edit._id);
        } else {
            await createWorkflow(data, closeModal);
        }
        if (setWorkflowState) setWorkflowState((prev: number) => prev + 1);
    };

    return (
        <Dialog open={open} onOpenChange={closeModal}>
            <DialogContent className="md:max-w-[650px] max-w-[calc(100%-30px)] py-7">
                <DialogHeader className="rounded-t-10 px-[30px] pb-5 border-b">
                    <DialogTitle className="font-semibold flex items-center flex-wrap gap-x-1">
                        {edit ? `Edit Workflow` : 'New Workflow'}
                    </DialogTitle>
                </DialogHeader>
                <form className="w-full" onSubmit={handleSubmit(processForm)}>
                    <div className="dialog-body flex flex-col flex-1 relative h-full px-[30px] pt-5 max-h-[70vh] overflow-y-auto">
                        <div className="relative mb-4 lg:mr-3 flex-1">
                            <Label title={"Workflow Name"} htmlFor={'name'} />
                            <input
                                type="text"
                                className="default-form-input"
                                id="name"
                                placeholder="Workflow Name"
                                {...register('name')}
                            />
                            <ValidationError errors={errors} field={'name'}></ValidationError>
                        </div>

                        <div className="relative mb-4 flex-1">
                            <Label title={"Brain"} htmlFor={'brain'} />
                            <CommonSelectInput
                                options={combined?.map((br: any) => ({
                                    value: br.title,
                                    label: br.title,
                                    slug: br.slug,
                                    isShare: br?.isShare,
                                    id: br._id
                                }))}
                                styles={customSelectStyles}
                                menuPlacement="auto"
                                // isMulti // Start with single brain support for simplicity
                                id="brain"
                                className="react-select-container"
                                classNamePrefix="react-select"
                                onChange={(e: any) => {
                                    // Handle single selection but store as array to match schema/logic
                                    setValue('brain', [e], { shouldValidate: true });
                                }}
                                value={watch('brain')?.[0]} // Display single value
                            />
                            <ValidationError errors={errors} field={'brain'}></ValidationError>
                        </div>

                        <div className="relative mb-4">
                            <Label title={"Description"} htmlFor={'description'} />
                            <textarea
                                className="default-form-input"
                                placeholder="Enter description here..."
                                id="description"
                                rows={3}
                                {...register('description')}
                            />
                            <ValidationError errors={errors} field={'description'}></ValidationError>
                        </div>

                        <Separator className="border-b10 border-b mt-3 mb-5" />

                        <div className="flex gap-4">
                            <div className="relative mb-4 flex-1">
                                <Label title={"Trigger Type"} htmlFor={'triggerType'} />
                                <select className="default-form-input" {...register('triggerType')}>
                                    <option value="manual">Manual</option>
                                    <option value="chat">Chat Command (#)</option>
                                    <option value="schedule">Schedule</option>
                                    <option value="webhook">Webhook</option>
                                </select>
                            </div>

                            {watch('triggerType') === 'chat' && (
                                <div className="relative mb-4 flex-1">
                                    <Label title={"Trigger Value (#keyword)"} htmlFor={'triggerValue'} />
                                    <input
                                        type="text"
                                        className="default-form-input"
                                        placeholder="e.g. summarize"
                                        {...register('triggerValue')}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="relative mb-4">
                            <Label title={"N8N Workflow ID"} htmlFor={'n8nWorkflowId'} />
                            <input
                                type="text"
                                className="default-form-input"
                                placeholder="N8N Workflow ID (optional)"
                                {...register('n8nWorkflowId')}
                            />
                            <p className="text-xs text-gray-500 mt-1">If empty, a new workflow will be created in n8n on sync.</p>
                        </div>

                        <DialogFooter className="flex items-center justify-center gap-2.5 pb-[30px] px-[30px]">
                            <button type='submit' className='btn btn-black' disabled={false}>Save</button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default WorkflowModal;
