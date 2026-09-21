"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { submitRequirementAction } from "@/lib/api/requirements";
import {
  defaultRequirementFormValues,
  normalizeRequirementFormValues,
  requirementFormResolver,
  type RequirementFormValues,
} from "@/lib/requirements/form-values";
import { WORKLOAD_TYPES } from "@/lib/validation";

const fieldClass =
  "mt-1.5 w-full rounded-control border border-border bg-surface px-3 py-2.5 text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent";
const labelClass = "text-sm font-medium text-text";
const errorClass = "mt-1.5 text-sm text-danger";
const helpClass = "mt-1.5 text-sm text-text-faint";
const cardClass = "rounded-card border border-border bg-surface p-5 sm:p-6";

const workloadLabels: Record<(typeof WORKLOAD_TYPES)[number], string> = {
  ai_training: "AI training",
  fine_tuning: "Fine-tuning",
  inference: "Inference",
  research: "Research",
  other: "Other",
};

const uptimeOptions = [
  { value: 9500, label: "95%" },
  { value: 9900, label: "99%" },
  { value: 9990, label: "99.9%" },
  { value: 10000, label: "100%" },
];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className={errorClass} role="alert">
      {message}
    </p>
  );
}

function CriterionFields({
  title,
  description,
  fields,
  registerPrefix,
  register,
  errors,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  fields: { id: string }[];
  registerPrefix: "mustHaves" | "niceToHaves";
  register: ReturnType<typeof useForm<RequirementFormValues>>["register"];
  errors: ReturnType<
    typeof useForm<RequirementFormValues>
  >["formState"]["errors"];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <fieldset className={`${cardClass} space-y-3`}>
      <legend className={labelClass}>{title}</legend>
      <p className={helpClass}>{description}</p>
      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label
              className="sr-only"
              htmlFor={`${registerPrefix}-${index}-key`}
            >
              {title} key {index + 1}
            </label>
            <input
              id={`${registerPrefix}-${index}-key`}
              className={fieldClass}
              placeholder="minimum_vram_gb"
              {...register(`${registerPrefix}.${index}.key`)}
            />
            <FieldError
              id={`${registerPrefix}-${index}-key-error`}
              message={errors[registerPrefix]?.[index]?.key?.message}
            />
          </div>
          <div>
            <label
              className="sr-only"
              htmlFor={`${registerPrefix}-${index}-value`}
            >
              {title} value {index + 1}
            </label>
            <input
              id={`${registerPrefix}-${index}-value`}
              className={fieldClass}
              placeholder="80"
              {...register(`${registerPrefix}.${index}.value`)}
            />
            <FieldError
              id={`${registerPrefix}-${index}-value-error`}
              message={errors[registerPrefix]?.[index]?.value?.message}
            />
          </div>
          <button
            type="button"
            className="mt-1 rounded-control border border-border px-3 py-2 text-sm text-text-muted transition-colors hover:border-accent hover:text-text"
            onClick={() => onRemove(index)}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-accent transition-colors hover:text-text"
        onClick={onAdd}
      >
        Add {title.toLowerCase()}
      </button>
    </fieldset>
  );
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function RequirementForm() {
  const router = useRouter();
  const ready = useIsClient();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RequirementFormValues>({
    defaultValues: defaultRequirementFormValues,
    resolver: requirementFormResolver,
  });

  const mustHaves = useFieldArray({ control, name: "mustHaves" });
  const niceToHaves = useFieldArray({ control, name: "niceToHaves" });

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitRequirementAction(
      normalizeRequirementFormValues(values),
    );

    if (result.ok) {
      router.push(`/quote/confirmation/${result.confirmation.id}`);
      return;
    }

    if (result.error === "validation") {
      for (const [path, messages] of Object.entries(result.fieldErrors)) {
        setError(path as keyof RequirementFormValues, {
          type: "server",
          message: messages[0],
        });
      }
    }

    if (result.formError) {
      setError("root", { type: "server", message: result.formError });
    }
  });

  return (
    <form
      className="mt-10 space-y-6"
      noValidate
      data-ready={ready ? "true" : "false"}
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      {errors.root?.message ? (
        <p className={errorClass} role="alert">
          {errors.root.message}
        </p>
      ) : null}

      <fieldset className={`${cardClass} grid gap-5 sm:grid-cols-2`}>
        <legend className="sr-only">Contact</legend>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="contactName">
            Contact name
          </label>
          <input
            id="contactName"
            className={fieldClass}
            autoComplete="name"
            {...register("contactName")}
            aria-invalid={Boolean(errors.contactName)}
            aria-describedby={
              errors.contactName ? "contactName-error" : undefined
            }
          />
          <FieldError
            id="contactName-error"
            message={errors.contactName?.message}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="contactEmail">
            Contact email
          </label>
          <input
            id="contactEmail"
            type="email"
            className={fieldClass}
            autoComplete="email"
            {...register("contactEmail")}
            aria-invalid={Boolean(errors.contactEmail)}
            aria-describedby={
              errors.contactEmail ? "contactEmail-error" : undefined
            }
          />
          <FieldError
            id="contactEmail-error"
            message={errors.contactEmail?.message}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="companyName">
            Company name
          </label>
          <input
            id="companyName"
            className={fieldClass}
            autoComplete="organization"
            {...register("companyName")}
            aria-invalid={Boolean(errors.companyName)}
            aria-describedby={
              errors.companyName ? "companyName-error" : undefined
            }
          />
          <FieldError
            id="companyName-error"
            message={errors.companyName?.message}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="companyWebsite">
            Company website
          </label>
          <input
            id="companyWebsite"
            type="url"
            className={fieldClass}
            placeholder="https://example.com"
            {...register("companyWebsite")}
            aria-invalid={Boolean(errors.companyWebsite)}
            aria-describedby={
              errors.companyWebsite ? "companyWebsite-error" : undefined
            }
          />
          <p className={helpClass}>Optional.</p>
          <FieldError
            id="companyWebsite-error"
            message={errors.companyWebsite?.message}
          />
        </div>
      </fieldset>

      <fieldset className={`${cardClass} grid gap-5 sm:grid-cols-2`}>
        <legend className="sr-only">Compute request</legend>
        <div>
          <label className={labelClass} htmlFor="workloadType">
            Workload type
          </label>
          <select
            id="workloadType"
            className={fieldClass}
            {...register("workloadType")}
            aria-invalid={Boolean(errors.workloadType)}
            aria-describedby={
              errors.workloadType ? "workloadType-error" : undefined
            }
          >
            <option value="">Select a workload</option>
            {WORKLOAD_TYPES.map((workloadType) => (
              <option key={workloadType} value={workloadType}>
                {workloadLabels[workloadType]}
              </option>
            ))}
          </select>
          <FieldError
            id="workloadType-error"
            message={errors.workloadType?.message}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="gpuModel">
            GPU preference
          </label>
          <input
            id="gpuModel"
            className={fieldClass}
            placeholder="H100"
            {...register("gpuModel")}
            aria-invalid={Boolean(errors.gpuModel)}
            aria-describedby={errors.gpuModel ? "gpuModel-error" : undefined}
          />
          <p className={helpClass}>
            Use a specific model, or enter flexible if any compatible GPU is
            acceptable.
          </p>
          <FieldError id="gpuModel-error" message={errors.gpuModel?.message} />
        </div>
        <div>
          <label className={labelClass} htmlFor="quantity">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={10000}
            className={fieldClass}
            {...register("quantity", { valueAsNumber: true })}
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={errors.quantity ? "quantity-error" : undefined}
          />
          <FieldError id="quantity-error" message={errors.quantity?.message} />
        </div>
        <div>
          <label className={labelClass} htmlFor="region">
            Region
          </label>
          <input
            id="region"
            className={fieldClass}
            placeholder="eu-west"
            {...register("region")}
            aria-invalid={Boolean(errors.region)}
            aria-describedby={errors.region ? "region-error" : undefined}
          />
          <FieldError id="region-error" message={errors.region?.message} />
        </div>
        <div>
          <label className={labelClass} htmlFor="timeframeStart">
            Start
          </label>
          <input
            id="timeframeStart"
            type="datetime-local"
            className={fieldClass}
            {...register("timeframeStart")}
            aria-invalid={Boolean(errors.timeframeStart)}
            aria-describedby={
              errors.timeframeStart ? "timeframeStart-error" : undefined
            }
          />
          <FieldError
            id="timeframeStart-error"
            message={errors.timeframeStart?.message}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="timeframeEnd">
            End
          </label>
          <input
            id="timeframeEnd"
            type="datetime-local"
            className={fieldClass}
            {...register("timeframeEnd")}
            aria-invalid={Boolean(errors.timeframeEnd)}
            aria-describedby={
              errors.timeframeEnd ? "timeframeEnd-error" : undefined
            }
          />
          <p className={helpClass}>Times are stored in UTC.</p>
          <FieldError
            id="timeframeEnd-error"
            message={errors.timeframeEnd?.message}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="budgetMinUsd">
            Budget minimum (USD)
          </label>
          <input
            id="budgetMinUsd"
            className={fieldClass}
            inputMode="decimal"
            placeholder="10000.00"
            {...register("budgetMinUsd")}
            aria-invalid={Boolean(errors.budgetMinUsd)}
            aria-describedby={
              errors.budgetMinUsd ? "budgetMinUsd-error" : undefined
            }
          />
          <p className={helpClass}>Optional.</p>
          <FieldError
            id="budgetMinUsd-error"
            message={errors.budgetMinUsd?.message}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="budgetMaxUsd">
            Budget maximum (USD)
          </label>
          <input
            id="budgetMaxUsd"
            className={fieldClass}
            inputMode="decimal"
            placeholder="30000.00"
            {...register("budgetMaxUsd")}
            aria-invalid={Boolean(errors.budgetMaxUsd)}
            aria-describedby={
              errors.budgetMaxUsd ? "budgetMaxUsd-error" : undefined
            }
          />
          <FieldError
            id="budgetMaxUsd-error"
            message={errors.budgetMaxUsd?.message}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="minimumUptimeBps">
            Minimum uptime
          </label>
          <select
            id="minimumUptimeBps"
            className={fieldClass}
            {...register("minimumUptimeBps", { valueAsNumber: true })}
            aria-invalid={Boolean(errors.minimumUptimeBps)}
            aria-describedby={
              errors.minimumUptimeBps ? "minimumUptimeBps-error" : undefined
            }
          >
            {uptimeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError
            id="minimumUptimeBps-error"
            message={errors.minimumUptimeBps?.message}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="slaNotes">
            SLA notes
          </label>
          <textarea
            id="slaNotes"
            rows={3}
            className={fieldClass}
            {...register("slaNotes")}
            aria-invalid={Boolean(errors.slaNotes)}
            aria-describedby={errors.slaNotes ? "slaNotes-error" : undefined}
          />
          <p className={helpClass}>
            Optional notes that are not yet machine-matchable.
          </p>
          <FieldError id="slaNotes-error" message={errors.slaNotes?.message} />
        </div>
      </fieldset>

      <CriterionFields
        title="Must-haves"
        description="Required constraints. Leave empty if none."
        fields={mustHaves.fields}
        registerPrefix="mustHaves"
        register={register}
        errors={errors}
        onAdd={() => mustHaves.append({ key: "", value: "" })}
        onRemove={mustHaves.remove}
      />
      <CriterionFields
        title="Nice-to-haves"
        description="Preferences only. These cannot repeat a must-have key."
        fields={niceToHaves.fields}
        registerPrefix="niceToHaves"
        register={register}
        errors={errors}
        onAdd={() => niceToHaves.append({ key: "", value: "" })}
        onRemove={niceToHaves.remove}
      />

      <div className={cardClass}>
        <label className={labelClass} htmlFor="additionalNotes">
          Additional notes
        </label>
        <textarea
          id="additionalNotes"
          rows={4}
          className={fieldClass}
          {...register("additionalNotes")}
          aria-invalid={Boolean(errors.additionalNotes)}
          aria-describedby={
            errors.additionalNotes ? "additionalNotes-error" : undefined
          }
        />
        <FieldError
          id="additionalNotes-error"
          message={errors.additionalNotes?.message}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !ready}
        className="rounded-control bg-accent-strong px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
