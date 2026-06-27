import { open } from "@tauri-apps/plugin-dialog";

export async function chooseDirectory(defaultPath?: string) {
  return normalizeSingleSelection(
    await open({
      canCreateDirectories: false,
      defaultPath: defaultPath || undefined,
      directory: true,
      multiple: false,
      title: "Choose repository folder",
    }),
  );
}

export async function chooseFile(defaultPath?: string) {
  return normalizeSingleSelection(
    await open({
      canCreateDirectories: false,
      defaultPath: defaultPath || undefined,
      directory: false,
      multiple: false,
      title: "Choose SSH private key",
    }),
  );
}

function normalizeSingleSelection(selection: string | string[] | null) {
  if (!selection || Array.isArray(selection)) {
    return null;
  }

  return selection;
}
