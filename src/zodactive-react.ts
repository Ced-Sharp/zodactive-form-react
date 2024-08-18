import {
  type FormFields,
  type Obj,
  type ObjEffect,
  type ZodactiveOptions,
  useZodactiveForm as createZodactiveForm,
} from "@zodactive-form/core";
import { useMemo, useSyncExternalStore } from "react";
import type { z } from "zod";

interface ReactiveStoreComponent {
  index: number;
  value: unknown;
}

/**
 * Creates a store based on the provided schema.
 * It is meant to be connected with `useSyncExternalStore`.
 * @param schema The zod schema used for validation.
 * @param initialData (Optional) The starting data of the form.
 */
export const createZodactiveFormStore = <S extends Obj | ObjEffect>(
  schema: S,
  initialData?: z.TypeOf<S>,
) => {
  const store: ReactiveStoreComponent[] = [];

  let listeners: Array<() => void> = [];
  let isDirty = true;
  let lastSnapshot: Omit<
    ReturnType<typeof createZodactiveForm<S>>,
    "form" | "formErrors" | "valid"
  > & {
    form: FormFields<z.TypeOf<S>>;
    formErrors: string[];
    valid: boolean;
  };

  const subscribe = (callback: () => void) => {
    listeners = [...listeners, callback];
    return () => {
      listeners = listeners.filter((c) => c !== callback);
    };
  };

  const triggerListeners = () => {
    for (const callback of listeners) {
      callback();
    }
  };

  const options: ZodactiveOptions<number> = {
    createReactive: () => {
      const key = store.length;
      store.push({ index: key, value: null });
      return key;
    },

    getReactive: (index: number) => {
      if (index < 0 || index >= store.length) {
        throw new Error("Store: Index out of bounds");
      }

      return store[index].value;
    },

    setReactive: (index: number, value: unknown) => {
      if (index < 0 || index >= store.length) {
        throw new Error("Store: Index out of bounds");
      }

      store[index].value = Array.isArray(value)
        ? [...(value as unknown[])]
        : typeof value === "object"
          ? { ...(value as object) }
          : value;

      isDirty = true;
      triggerListeners();
    },
  };

  const formContext = createZodactiveForm(options, schema, initialData);

  const getSnapshot = () => {
    if (isDirty) {
      const form = options.getReactive(formContext.form) as FormFields<
        z.TypeOf<S>
      >;
      const formErrors = options.getReactive(
        formContext.formErrors,
      ) as string[];
      const valid = options.getReactive(formContext.valid) as boolean;

      // Suppressing unused vars because they are actually meaningful.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { form: a, formErrors: b, valid: c, ...rest } = formContext;

      lastSnapshot = {
        ...rest,
        form,
        formErrors,
        valid,
      };
    }

    isDirty = false;
    return lastSnapshot;
  };

  return { subscribe, getSnapshot };
};

/**
 * Creates and configures an external store with
 * the provided schema and initialData. The store
 * is automatically hooked into `useSyncExternalStore`
 * and ready to be used in a react component.
 * @param schema The zod schema used for validation.
 * @param initialData (Optional) The starting data of the form.
 */
export const useForm = <S extends Obj | ObjEffect>(
  schema: S,
  initialData?: z.TypeOf<S>,
) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: This memo is meant to never re-run.
  const store = useMemo(() => {
    return createZodactiveFormStore(schema, initialData);
    // eslint-disable-next-line
  }, []);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
