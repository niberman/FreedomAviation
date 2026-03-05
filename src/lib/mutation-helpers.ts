import { toast } from '@/hooks/use-toast';

/**
 * Standard onError handler for TanStack Query mutations.
 * Shows a destructive toast with the error message.
 *
 * Usage:
 *   useMutation({ mutationFn: ..., onError: onMutationError })
 *   useMutation({ mutationFn: ..., onError: (e) => onMutationError(e, 'Custom title') })
 */
export function onMutationError(error: Error, title = 'Error') {
  toast({
    title,
    description: error.message,
    variant: 'destructive',
  });
}

/**
 * Standard onSuccess handler for mutations that shows a success toast.
 *
 * Usage:
 *   onSuccess: () => onMutationSuccess('Saved', 'Aircraft updated successfully.')
 */
export function onMutationSuccess(title: string, description: string) {
  toast({ title, description });
}
