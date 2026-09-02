import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
  DefaultValues,
  FieldValues,
  Resolver,
  UseFormReturn,
} from 'react-hook-form';
import type { z } from 'zod';

import { UnknownError, toAppError } from '../api/errors/errors';

/**
 * Standard mobile form pattern: React Hook Form + Zod.
 *
 * Every form goes through this hook so validation mode, error surfacing and
 * submission semantics stay identical across the app.
 */

/**
 * Single, isolated cast point between Zod 4 and React Hook Form's resolver
 * types. Keeping it here stops `as unknown as` from spreading into screens.
 */
export function appZodResolver<TValues extends FieldValues>(schema: z.ZodType): Resolver<TValues> {
  // Zod 4 and React Hook Form expose structurally different schema types; the
  // runtime contract is verified by the form tests, so the cast is contained
  // here rather than leaking into every form.
  return zodResolver(schema as never) as Resolver<TValues>;
}

export interface UseAppFormOptions<TValues extends FieldValues> {
  readonly resolver?: Resolver<TValues>;
  readonly schema?: z.ZodType;
  readonly defaultValues: DefaultValues<TValues>;
}

export interface UseAppFormResult<TValues extends FieldValues> {
  readonly form: UseFormReturn<TValues>;
  readonly control: UseFormReturn<TValues>['control'];
  readonly handleSubmit: UseFormReturn<TValues>['handleSubmit'];
  readonly isSubmitting: boolean;
  readonly submitError: string | null;
  /** Wraps a submit handler with loading + error normalisation. */
  readonly submitWith: (
    handler: (values: TValues) => Promise<void> | void,
  ) => (values: TValues) => Promise<void>;
  readonly clearSubmitError: () => void;
}

export function useAppForm<TValues extends FieldValues>(
  options: UseAppFormOptions<TValues>,
): UseAppFormResult<TValues> {
  const resolver = options.resolver ?? (options.schema ? appZodResolver<TValues>(options.schema) : undefined);
  const form = useForm<TValues>({
    resolver,
    defaultValues: options.defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitWith = useCallback(
    (handler: (values: TValues) => Promise<void> | void) =>
      async (values: TValues) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
          await handler(values);
        } catch (error) {
          const appError = toAppError(error);
          setSubmitError(appError.message || new UnknownError().message);
        } finally {
          setIsSubmitting(false);
        }
      },
    [],
  );

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  return {
    form,
    control: form.control,
    handleSubmit: form.handleSubmit,
    isSubmitting,
    submitError,
    submitWith,
    clearSubmitError,
  };
}
