import * as yup from 'yup';

export const workflowCreateSchema = yup.object({
    name: yup.string().required('Workflow Name is required'),
    description: yup.string().optional(),
    brain: yup
        .array()
        .of(
            yup.object().shape({
                value: yup.string().required('Please select a brain'),
                label: yup.string().optional(),
                id: yup.string().optional(),
                slug: yup.string().optional(),
            })
        )
        .min(1, 'Please select at least one brain'),
    n8nWorkflowId: yup.string().optional(),
    triggerType: yup.string().optional(),
    triggerValue: yup.string().optional(),
})
