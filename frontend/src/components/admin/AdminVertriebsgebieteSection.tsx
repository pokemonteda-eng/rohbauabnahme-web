import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  createVertriebsgebiet,
  deleteVertriebsgebiet,
  listVertriebsgebiete,
  type Vertriebsgebiet,
  VertriebsgebieteApiError,
  updateVertriebsgebiet
} from "@/api/vertriebsgebiete";

type FormValues = {
  name: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  name: ""
};

function sortVertriebsgebiete(entries: Vertriebsgebiet[]) {
  return [...entries].sort(
    (left, right) => left.name.localeCompare(right.name, "de", { sensitivity: "base" }) || left.id - right.id
  );
}

function validateForm(values: FormValues) {
  const errors: FormErrors = {};
  const normalizedName = values.name.trim();

  if (!normalizedName) {
    errors.name = "Name ist erforderlich.";
  }

  return {
    errors,
    normalized: {
      name: normalizedName
    }
  };
}

export function AdminVertriebsgebieteSection() {
  const [gebiete, setGebiete] = useState<Vertriebsgebiet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingVersion, setEditingVersion] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isEditing = editingId !== null && editingVersion !== null;
  const currentGebiet = useMemo(
    () => gebiete.find((entry) => entry.id === editingId) ?? null,
    [editingId, gebiete]
  );

  const resetForm = () => {
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
    setEditingVersion(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const loadGebiete = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await listVertriebsgebiete();
      setGebiete(sortVertriebsgebiete(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vertriebsgebiete konnten nicht geladen werden.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadGebiete();
  }, []);

  useEffect(() => {
    if (editingId === null) {
      return;
    }
    if (currentGebiet === null) {
      resetForm();
      return;
    }
    setEditingVersion(currentGebiet.version);
    setFormValues({ name: currentGebiet.name });
  }, [currentGebiet, editingId]);

  const handleFieldChange = (field: keyof FormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleEdit = (gebiet: Vertriebsgebiet) => {
    setEditingId(gebiet.id);
    setEditingVersion(gebiet.version);
    setFormValues({ name: gebiet.name });
    setFormErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleReload = async () => {
    await loadGebiete();
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { errors, normalized } = validateForm(formValues);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitError(null);
      setSubmitSuccess(null);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (isEditing && editingId !== null && editingVersion !== null) {
        const updated = await updateVertriebsgebiet(editingId, {
          ...normalized,
          version: editingVersion
        });
        setGebiete((current) => sortVertriebsgebiete(current.map((entry) => (entry.id === updated.id ? updated : entry))));
        setEditingVersion(updated.version);
        setFormValues({ name: updated.name });
        setSubmitSuccess(`Vertriebsgebiet "${updated.name}" wurde aktualisiert.`);
      } else {
        const created = await createVertriebsgebiet(normalized);
        setGebiete((current) => sortVertriebsgebiete([...current, created]));
        setFormValues(EMPTY_FORM);
        setSubmitSuccess(`Vertriebsgebiet "${created.name}" wurde angelegt.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vertriebsgebiet konnte nicht gespeichert werden.";
      setSubmitError(message);
      if (
        error instanceof VertriebsgebieteApiError &&
        (error.status === 404 || error.detail === "Vertriebsgebiet wurde zwischenzeitlich geaendert")
      ) {
        await loadGebiete();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (gebiet: Vertriebsgebiet) => {
    setDeletingId(gebiet.id);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await deleteVertriebsgebiet(gebiet.id, gebiet.version);
      setGebiete((current) => current.filter((entry) => entry.id !== gebiet.id));
      if (editingId === gebiet.id) {
        resetForm();
      }
      setSubmitSuccess(`Vertriebsgebiet "${gebiet.name}" wurde geloescht.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vertriebsgebiet konnte nicht geloescht werden.";
      setSubmitError(message);
      if (error instanceof VertriebsgebieteApiError && (error.status === 404 || error.status === 409)) {
        await loadGebiete();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.9fr)]">
      <article className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
        <div className="flex flex-col gap-3 border-b border-stone-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-amber-200">TASK-122</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Vertriebsgebiete verwalten</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
              Anlegen, bearbeiten und loeschen mit Versionspruefung.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleReload()}
            className="inline-flex items-center justify-center rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-stone-500 hover:text-white"
          >
            Liste neu laden
          </button>
        </div>

        {loadError ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100" role="alert">
            <p className="font-semibold">Vertriebsgebiete konnten nicht geladen werden.</p>
            <p className="mt-2">{loadError}</p>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <p className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 text-sm text-stone-300">Vertriebsgebiete werden geladen...</p>
          ) : gebiete.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/50 p-5 text-sm text-stone-400">
              Es sind noch keine Vertriebsgebiete vorhanden.
            </p>
          ) : (
            gebiete.map((gebiet) => {
              const isDeleting = deletingId === gebiet.id;
              const isActive = editingId === gebiet.id;
              return (
                <article
                  key={gebiet.id}
                  className={[
                    "rounded-3xl border p-5 transition",
                    isActive ? "border-amber-300/40 bg-amber-300/10" : "border-stone-800 bg-stone-900/60"
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{gebiet.name}</h3>
                        <span className="rounded-full border border-stone-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300">
                          Version {gebiet.version}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleEdit(gebiet)}
                        className="inline-flex items-center justify-center rounded-full border border-amber-300/40 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-200 hover:text-white"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(gebiet)}
                        disabled={isDeleting}
                        className="inline-flex items-center justify-center rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300 disabled:opacity-60"
                      >
                        {isDeleting ? "Loescht..." : "Loeschen"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </article>

      <aside className="rounded-3xl border border-stone-800 bg-stone-900/80 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">{isEditing ? "Bearbeiten" : "Anlegen"}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isEditing ? "Vertriebsgebiet aktualisieren" : "Neues Vertriebsgebiet anlegen"}
            </h2>
          </div>
          {isEditing ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-stone-500 hover:text-white"
            >
              Abbrechen
            </button>
          ) : null}
        </div>

        {submitError ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100" role="alert">
            <p className="font-semibold">Aktion fehlgeschlagen.</p>
            <p className="mt-2">{submitError}</p>
          </div>
        ) : null}

        {submitSuccess ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100" role="status">
            {submitSuccess}
          </div>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div>
            <label htmlFor="gebiet-name" className="text-sm font-medium text-stone-200">
              Name
            </label>
            <input
              id="gebiet-name"
              name="name"
              value={formValues.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              className="mt-2 block h-11 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none transition focus:border-amber-300"
            />
            {formErrors.name ? <p className="mt-2 text-sm text-rose-300">{formErrors.name}</p> : null}
          </div>

          {isEditing && currentGebiet ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 text-sm text-stone-300">
              Du bearbeitest <span className="font-semibold text-white">{currentGebiet.name}</span> mit Version{" "}
              <span className="font-semibold text-white">{editingVersion}</span>.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-200 disabled:opacity-60"
          >
            {isSubmitting ? "Speichert..." : isEditing ? "Speichern" : "Anlegen"}
          </button>
        </form>
      </aside>
    </section>
  );
}
