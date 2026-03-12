import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  createLampentyp,
  deleteLampentyp,
  listLampentypen,
  type Lampentyp,
  LampentypenApiError,
  updateLampentyp
} from "@/api/lampentypen";

type FormValues = {
  name: string;
  beschreibung: string;
  iconUrl: string;
  standardPreis: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  name: "",
  beschreibung: "",
  iconUrl: "",
  standardPreis: ""
};

function sortLampentypen(entries: Lampentyp[]) {
  return [...entries].sort(
    (left, right) => left.name.localeCompare(right.name, "de", { sensitivity: "base" }) || left.id - right.id
  );
}

function formatPreis(value: number) {
  return value.toFixed(2);
}

function toFormValues(lampentyp: Lampentyp): FormValues {
  return {
    name: lampentyp.name,
    beschreibung: lampentyp.beschreibung,
    iconUrl: lampentyp.icon_url,
    standardPreis: formatPreis(lampentyp.standard_preis)
  };
}

function validateForm(values: FormValues) {
  const errors: FormErrors = {};
  const normalizedName = values.name.trim();
  const normalizedBeschreibung = values.beschreibung.trim();
  const normalizedIconUrl = values.iconUrl.trim();
  const normalizedPreis = values.standardPreis.trim().replace(",", ".");

  if (!normalizedName) {
    errors.name = "Name ist erforderlich.";
  }

  if (!normalizedBeschreibung) {
    errors.beschreibung = "Beschreibung ist erforderlich.";
  }

  if (!normalizedIconUrl) {
    errors.iconUrl = "Icon-URL ist erforderlich.";
  } else {
    try {
      new URL(normalizedIconUrl);
    } catch {
      errors.iconUrl = "Icon-URL muss eine gueltige absolute URL sein.";
    }
  }

  if (!normalizedPreis) {
    errors.standardPreis = "Standard-Preis ist erforderlich.";
  } else {
    const parsedPreis = Number(normalizedPreis);

    if (!Number.isFinite(parsedPreis)) {
      errors.standardPreis = "Standard-Preis muss eine Zahl sein.";
    } else if (parsedPreis < 0) {
      errors.standardPreis = "Standard-Preis darf nicht negativ sein.";
    }
  }

  return {
    errors,
    normalized: {
      name: normalizedName,
      beschreibung: normalizedBeschreibung,
      icon_url: normalizedIconUrl,
      standard_preis: Number(normalizedPreis)
    }
  };
}

export function AdminLampentypenSection() {
  const [lampentypen, setLampentypen] = useState<Lampentyp[]>([]);
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
  const currentLampentyp = useMemo(
    () => lampentypen.find((entry) => entry.id === editingId) ?? null,
    [editingId, lampentypen]
  );

  const resetForm = () => {
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
    setEditingVersion(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const loadLampentypen = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await listLampentypen();
      setLampentypen(sortLampentypen(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lampentypen konnten nicht geladen werden.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLampentypen();
  }, []);

  useEffect(() => {
    if (editingId === null) {
      return;
    }

    if (currentLampentyp === null) {
      resetForm();
      return;
    }

    setEditingVersion(currentLampentyp.version);
    setFormValues(toFormValues(currentLampentyp));
  }, [currentLampentyp, editingId]);

  const handleFieldChange = (field: keyof FormValues, value: string) => {
    setFormValues((current) => ({
      ...current,
      [field]: value
    }));
    setFormErrors((current) => ({
      ...current,
      [field]: undefined
    }));
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleEdit = (lampentyp: Lampentyp) => {
    setEditingId(lampentyp.id);
    setEditingVersion(lampentyp.version);
    setFormValues(toFormValues(lampentyp));
    setFormErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleReload = async () => {
    await loadLampentypen();
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
        const updated = await updateLampentyp(editingId, {
          ...normalized,
          version: editingVersion
        });

        setLampentypen((current) => sortLampentypen(current.map((entry) => (entry.id === updated.id ? updated : entry))));
        setEditingVersion(updated.version);
        setFormValues(toFormValues(updated));
        setSubmitSuccess(`Lampentyp "${updated.name}" wurde aktualisiert.`);
      } else {
        const created = await createLampentyp(normalized);
        setLampentypen((current) => sortLampentypen([...current, created]));
        setFormValues(EMPTY_FORM);
        setSubmitSuccess(`Lampentyp "${created.name}" wurde angelegt.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lampentyp konnte nicht gespeichert werden.";
      setSubmitError(message);

      if (
        error instanceof LampentypenApiError &&
        (error.status === 404 || error.detail === "Lampentyp wurde zwischenzeitlich geaendert")
      ) {
        await loadLampentypen();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (lampentyp: Lampentyp) => {
    setDeletingId(lampentyp.id);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await deleteLampentyp(lampentyp.id, lampentyp.version);
      setLampentypen((current) => current.filter((entry) => entry.id !== lampentyp.id));

      if (editingId === lampentyp.id) {
        resetForm();
      }

      setSubmitSuccess(`Lampentyp "${lampentyp.name}" wurde geloescht.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lampentyp konnte nicht geloescht werden.";
      setSubmitError(message);

      if (error instanceof LampentypenApiError && (error.status === 404 || error.status === 409)) {
        await loadLampentypen();
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
            <p className="text-sm uppercase tracking-[0.24em] text-amber-200">TASK-116</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Lampentypen verwalten</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
              Anlegen, bearbeiten und loeschen mit Frontend-Validierung, Versionierung und klarer API-Fehlerbehandlung.
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
            <p className="font-semibold">Lampentypen konnten nicht geladen werden.</p>
            <p className="mt-2">{loadError}</p>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <p className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 text-sm text-stone-300">Lampentypen werden geladen...</p>
          ) : lampentypen.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/50 p-5 text-sm text-stone-400">
              Es sind noch keine Lampentypen vorhanden.
            </p>
          ) : (
            lampentypen.map((lampentyp) => {
              const isDeleting = deletingId === lampentyp.id;
              const isActive = editingId === lampentyp.id;

              return (
                <article
                  key={lampentyp.id}
                  className={[
                    "rounded-3xl border p-5 transition",
                    isActive ? "border-amber-300/40 bg-amber-300/10" : "border-stone-800 bg-stone-900/60"
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{lampentyp.name}</h3>
                        <span className="rounded-full border border-stone-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300">
                          Version {lampentyp.version}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-stone-300">{lampentyp.beschreibung}</p>
                      <dl className="mt-4 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
                        <div>
                          <dt className="text-stone-500">Icon-URL</dt>
                          <dd className="mt-1 break-all text-stone-200">{lampentyp.icon_url}</dd>
                        </div>
                        <div>
                          <dt className="text-stone-500">Standard-Preis</dt>
                          <dd className="mt-1 text-stone-200">{formatPreis(lampentyp.standard_preis)} EUR</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleEdit(lampentyp)}
                        className="inline-flex items-center justify-center rounded-full border border-amber-300/40 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-200 hover:text-white"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(lampentyp)}
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
              {isEditing ? "Lampentyp aktualisieren" : "Neuen Lampentyp anlegen"}
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
            <label htmlFor="lampentyp-name" className="text-sm font-medium text-stone-200">
              Name
            </label>
            <input
              id="lampentyp-name"
              name="name"
              value={formValues.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              className="mt-2 block h-11 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none transition focus:border-amber-300"
            />
            {formErrors.name ? <p className="mt-2 text-sm text-rose-300">{formErrors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="lampentyp-beschreibung" className="text-sm font-medium text-stone-200">
              Beschreibung
            </label>
            <textarea
              id="lampentyp-beschreibung"
              name="beschreibung"
              value={formValues.beschreibung}
              onChange={(event) => handleFieldChange("beschreibung", event.target.value)}
              rows={5}
              className="mt-2 block w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300"
            />
            {formErrors.beschreibung ? <p className="mt-2 text-sm text-rose-300">{formErrors.beschreibung}</p> : null}
          </div>

          <div>
            <label htmlFor="lampentyp-icon-url" className="text-sm font-medium text-stone-200">
              Icon-URL
            </label>
            <input
              id="lampentyp-icon-url"
              name="iconUrl"
              value={formValues.iconUrl}
              onChange={(event) => handleFieldChange("iconUrl", event.target.value)}
              className="mt-2 block h-11 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none transition focus:border-amber-300"
            />
            {formErrors.iconUrl ? <p className="mt-2 text-sm text-rose-300">{formErrors.iconUrl}</p> : null}
          </div>

          <div>
            <label htmlFor="lampentyp-standard-preis" className="text-sm font-medium text-stone-200">
              Standard-Preis in EUR
            </label>
            <input
              id="lampentyp-standard-preis"
              name="standardPreis"
              inputMode="decimal"
              value={formValues.standardPreis}
              onChange={(event) => handleFieldChange("standardPreis", event.target.value)}
              className="mt-2 block h-11 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none transition focus:border-amber-300"
            />
            {formErrors.standardPreis ? <p className="mt-2 text-sm text-rose-300">{formErrors.standardPreis}</p> : null}
          </div>

          {isEditing && currentLampentyp ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 text-sm text-stone-300">
              Du bearbeitest <span className="font-semibold text-white">{currentLampentyp.name}</span> mit Version{" "}
              <span className="font-semibold text-white">{editingVersion}</span>.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-200 disabled:opacity-60"
          >
            {isSubmitting ? "Speichert..." : isEditing ? "Lampentyp speichern" : "Lampentyp anlegen"}
          </button>
        </form>
      </aside>
    </section>
  );
}
