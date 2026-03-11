import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { createAufbau, deleteAufbau, listAufbauten, updateAufbau, type Aufbau } from "@/api/aufbauten";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = {
  name: string;
  aktiv: boolean;
  bild: File | null;
};

const INITIAL_FORM_STATE: FormState = {
  name: "",
  aktiv: true,
  bild: null
};

function formatStatusLabel(aktiv: boolean) {
  return aktiv ? "Aktiv" : "Inaktiv";
}

export function AufbautenAdminSection() {
  const [items, setItems] = useState<Aufbau[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await listAufbauten(controller.signal);
        setItems(data);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Aufbauten konnten nicht geladen werden.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (formState.bild == null) {
      return undefined;
    }

    if (typeof URL.createObjectURL !== "function") {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(formState.bild);
    setPreviewUrl(objectUrl);

    return () => {
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [formState.bild]);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items]
  );

  useEffect(() => {
    if (formState.bild != null) {
      return;
    }

    setPreviewUrl(editingItem?.bild_url ?? null);
  }, [editingItem, formState.bild]);

  function resetForm() {
    setFormState(INITIAL_FORM_STATE);
    setPreviewUrl(null);
    setEditingId(null);
    setSubmitError(null);
    if (fileInputRef.current != null) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (formState.name.trim().length === 0) {
      setSubmitError("Name ist erforderlich.");
      return;
    }

    if (editingId === null && formState.bild == null) {
      setSubmitError("Bitte ein PNG fuer den Aufbau auswaehlen.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formState.name.trim(),
        aktiv: formState.aktiv,
        bild: formState.bild
      };

      if (editingId === null) {
        const created = await createAufbau(payload);
        setItems((current) => [...current, created].sort((left, right) => left.name.localeCompare(right.name)));
      } else {
        const updated = await updateAufbau(editingId, payload);
        setItems((current) =>
          current
            .map((item) => (item.id === updated.id ? updated : item))
            .sort((left, right) => left.name.localeCompare(right.name))
        );
      }

      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Aufbau konnte nicht gespeichert werden.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(item: Aufbau) {
    setEditingId(item.id);
    setFormState({
      name: item.name,
      aktiv: item.aktiv,
      bild: null
    });
    setPreviewUrl(item.bild_url);
    setSubmitError(null);
  }

  async function handleDelete(id: number) {
    try {
      setDeletingId(id);
      setDeleteError(null);
      await deleteAufbau(id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Aufbau konnte nicht geloescht werden.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.9fr)]">
      <article className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-amber-200">TASK-101</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Aufbauten verwalten</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
              Namen, Aktiv-Status und PNG-Vorlagen werden zentral gepflegt und stehen danach fuer Folge-Module bereit.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Datensaetze</p>
            <p className="mt-1 text-3xl font-semibold text-white">{items.length}</p>
          </div>
        </div>

        {loadError ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {loadError}
          </div>
        ) : null}

        {deleteError ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {deleteError}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {isLoading ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 text-sm text-stone-400">
              Aufbauten werden geladen...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/40 p-6 text-sm text-stone-400">
              Noch keine Aufbauten vorhanden. Lege rechts den ersten Datensatz mit PNG an.
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 rounded-3xl border border-stone-800 bg-stone-900/70 p-4 md:grid-cols-[140px_minmax(0,1fr)_auto]"
              >
                <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-950">
                  <img src={item.bild_url} alt={`Vorschau ${item.name}`} className="h-28 w-full object-cover" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                        item.aktiv
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-stone-700/70 text-stone-300"
                      ].join(" ")}
                    >
                      {formatStatusLabel(item.aktiv)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-stone-400">Bildpfad: {item.bild_pfad}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Aktualisiert: {new Date(item.aktualisiert_am).toLocaleString("de-DE")}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" onClick={() => handleEdit(item)}>
                    Bearbeiten
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void handleDelete(item.id)}
                    disabled={deletingId !== null}
                    className="text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
                  >
                    {deletingId === item.id ? "Loesche..." : "Loeschen"}
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </article>

      <aside className="rounded-3xl border border-stone-800 bg-stone-900/80 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Formular</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {editingId === null ? "Neuen Aufbau anlegen" : "Aufbau bearbeiten"}
            </h2>
          </div>
          {editingId !== null ? (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Abbrechen
            </Button>
          ) : null}
        </div>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="aufbau-name">Name</Label>
            <Input
              id="aufbau-name"
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  name: event.target.value
                }))
              }
              placeholder="z. B. FB 500"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3">
            <div>
              <Label htmlFor="aufbau-aktiv">Aktiv</Label>
              <p className="mt-1 text-sm text-stone-400">Nur aktive Aufbauten erscheinen spaeter im Dropdown.</p>
            </div>
            <input
              id="aufbau-aktiv"
              type="checkbox"
              checked={formState.aktiv}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  aktiv: event.target.checked
                }))
              }
              className="h-5 w-5 rounded border-stone-600 bg-stone-900 text-amber-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aufbau-bild">PNG-Datei</Label>
            <Input
              id="aufbau-bild"
              ref={fileInputRef}
              type="file"
              accept="image/png"
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  bild: event.target.files?.[0] ?? null
                }))
              }
            />
            <p className="text-xs leading-5 text-stone-500">
              {editingId === null
                ? "Beim Anlegen ist eine PNG-Datei verpflichtend."
                : "Optional neues PNG hochladen, um die vorhandene Vorlage zu ersetzen."}
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-dashed border-stone-700 bg-stone-950/70">
            {previewUrl ? (
              <img src={previewUrl} alt="PNG-Vorschau" className="h-52 w-full object-cover" />
            ) : (
              <div className="flex h-52 items-center justify-center px-6 text-center text-sm text-stone-500">
                PNG-Vorschau erscheint nach Auswahl oder beim Bearbeiten eines vorhandenen Aufbaus.
              </div>
            )}
          </div>

          {submitError ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
              {submitError}
            </div>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Speichere..." : editingId === null ? "Aufbau anlegen" : "Aenderungen speichern"}
          </Button>
        </form>
      </aside>
    </section>
  );
}
