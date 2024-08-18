import { act, renderHook } from "@testing-library/react";
import type { FormFields } from "@zodactive-form/core";
import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { useForm } from "../src";

const userSchema = z.object({
  name: z.string().min(3, "3!"),
  age: z.number().min(18, "18!"),
  displayName: z.string().min(3, "3!").optional(),
});

const matchInitial = {
  name: { value: "", error: "" },
  age: { value: 0, error: "" },
};

const matchAssigned = {
  name: { value: "a", error: "" },
  age: { value: 1, error: "" },
};

const matchValidNoOptional = {
  name: { value: "test", error: "" },
  age: { value: 20, error: "" },
};

const matchValidWithOptional = {
  name: { value: "test", error: "" },
  age: { value: 20, error: "" },
  displayName: { value: "Test", error: "" },
};

describe("Zodactive Form - React", () => {
  it("should return react state with proper typing", () => {
    const {
      result: { current: context },
    } = renderHook(() => useForm(userSchema));
    expect(context).toHaveProperty("form");
    expect(context).toHaveProperty("formErrors");
    expect(context).toHaveProperty("valid");
    expectTypeOf(context.form).toMatchTypeOf<
      FormFields<z.infer<typeof userSchema>>
    >();
    expectTypeOf(context.formErrors).toMatchTypeOf<string[]>();
    expectTypeOf(context.valid).toMatchTypeOf<boolean>();
  });

  it("should have the value react to calling `assign()`", () => {
    const { result } = renderHook(() => useForm(userSchema));
    expect(result.current.form).toMatchObject(matchInitial);

    act(() => result.current.assign("name", "a"));
    act(() => result.current.assign("age", 1));

    expect(result.current.form).toMatchObject(matchAssigned);
  });

  it("should have errors react to calling `validate()`", async () => {
    const { result } = renderHook(() => useForm(userSchema));
    expect(result.current.valid).toBe(false);

    act(() => result.current.assign("name", "test"));
    act(() => result.current.assign("age", 20));
    await act(() => result.current.validate());

    expect(result.current.form).toMatchObject(matchValidNoOptional);
    expect(result.current.valid).toBe(true);
  });

  it("should have `valid` react to calling `validate()`", async () => {
    const { result } = renderHook(() => useForm(userSchema));
    expect(result.current.valid).toBe(false);

    act(() => result.current.assign("name", "test"));
    act(() => result.current.assign("age", 20));
    await act(() => result.current.validate());

    expect(result.current.valid).toBe(true);

    act(() => result.current.assign("displayName", "a"));
    await act(() => result.current.validate());

    expect(result.current.form).toMatchObject({
      ...matchValidNoOptional,
      displayName: {
        value: "a",
        error: "3!",
      },
    });
    expect(result.current.valid).toBe(false);

    act(() => result.current.assign("displayName", "Test"));
    await act(() => result.current.validate());

    expect(result.current.form).toMatchObject(matchValidWithOptional);
    expect(result.current.valid).toBe(true);
  });
});
