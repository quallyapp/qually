import { uploadJson, readJsonFromWalrus } from "./walrus";

interface BountyRegistryEntry {
  id: string;
  createdAt: string;
}

interface BountyRegistry {
  posterAddress: string;
  bounties: BountyRegistryEntry[];
  updatedAt: string;
}

const LOCAL_INDEX_KEY = "qually_bounty_registry_index";

function getLocalIndex(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_INDEX_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalIndex(index: Record<string, string>) {
  localStorage.setItem(LOCAL_INDEX_KEY, JSON.stringify(index));
}

export async function addBountyToRegistry(bountyId: string, posterAddress: string): Promise<void> {
  const localIndex = getLocalIndex();
  const key = posterAddress.toLowerCase();

  let existing: BountyRegistry = { posterAddress, bounties: [], updatedAt: new Date().toISOString() };

  // Try to load existing registry from Walrus
  if (localIndex[key]) {
    try {
      existing = await readJsonFromWalrus<BountyRegistry>(localIndex[key]);
    } catch {}
  }

  // Add new bounty if not already present
  if (!existing.bounties.some((b) => b.id === bountyId)) {
    existing.bounties.push({ id: bountyId, createdAt: new Date().toISOString() });
    existing.updatedAt = new Date().toISOString();
  }

  // Upload to Walrus
  try {
    const result = await uploadJson(existing as unknown as Record<string, unknown>);
    localIndex[key] = result.blobId;
    saveLocalIndex(localIndex);
  } catch (e) {
    console.warn("[Qually] Failed to upload bounty registry to Walrus:", e);
  }
}

export async function getPosterBountyIds(posterAddress: string): Promise<string[]> {
  const localIndex = getLocalIndex();
  const key = posterAddress.toLowerCase();

  if (!localIndex[key]) return [];

  try {
    const registry = await readJsonFromWalrus<BountyRegistry>(localIndex[key]);
    return registry.bounties.map((b) => b.id);
  } catch {
    return [];
  }
}

export async function getAllPosterBountyIds(): Promise<string[]> {
  const localIndex = getLocalIndex();
  const allIds: string[] = [];

  for (const blobId of Object.values(localIndex)) {
    try {
      const registry = await readJsonFromWalrus<BountyRegistry>(blobId);
      for (const b of registry.bounties) {
        if (!allIds.includes(b.id)) allIds.push(b.id);
      }
    } catch {}
  }

  return allIds;
}
