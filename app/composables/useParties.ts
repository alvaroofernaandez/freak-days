import { useAuthStore } from "~~/stores/auth";

export interface Party {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string | null;
  ownerId: string;
  maxMembers: number;
  members: PartyMember[];
}

export interface PartyMember {
  id: string;
  partyId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
  profile?: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export function useParties() {
  const supabase = useSupabase();
  const authStore = useAuthStore();

  async function fetchUserParties(): Promise<Party[]> {
    if (!authStore.userId) return [];

    const { data: memberships, error } = await supabase
      .from("party_members")
      .select(
        `
        party_id,
        parties (
          *,
          party_members (
            *,
            profiles (username, display_name, avatar_url)
          )
        )
      `
      )
      .eq("user_id", authStore.userId);

    if (error) throw error;

    return (memberships ?? [])
      .filter((m) => m.parties)
      .map((m) => mapDbToParty(m.parties as Record<string, unknown>));
  }

  async function createParty(
    name: string,
    description?: string
  ): Promise<Party | null> {
    if (!authStore.userId) return null;

    const inviteCode = generateInviteCode();

    const { data: party, error: partyError } = await supabase
      .from("parties")
      .insert({
        name,
        description,
        owner_id: authStore.userId,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (partyError) throw partyError;
    if (!party) return null;

    await supabase.from("party_members").insert({
      party_id: party.id,
      user_id: authStore.userId,
      role: "owner",
    });

    return fetchPartyById(party.id);
  }

  async function joinByCode(code: string): Promise<Party | null> {
    if (!authStore.userId) return null;

    const { data: party, error: findError } = await supabase
      .from("parties")
      .select("*")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (findError || !party) return null;

    const { error: joinError } = await supabase.from("party_members").insert({
      party_id: party.id,
      user_id: authStore.userId,
      role: "member",
    });

    if (joinError) throw joinError;

    return fetchPartyById(party.id);
  }

  async function fetchPartyById(id: string): Promise<Party | null> {
    const { data, error } = await supabase
      .from("parties")
      .select(
        `
        *,
        party_members (
          *,
          profiles (username, display_name, avatar_url)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) return null;
    return data ? mapDbToParty(data) : null;
  }

  async function leaveParty(partyId: string): Promise<boolean> {
    if (!authStore.userId) return false;

    const { error } = await supabase
      .from("party_members")
      .delete()
      .eq("party_id", partyId)
      .eq("user_id", authStore.userId);

    return !error;
  }

  function generateInviteCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function mapDbToParty(row: Record<string, unknown>): Party {
    const members = (row.party_members as Array<Record<string, unknown>>) ?? [];

    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | null,
      inviteCode: row.invite_code as string | null,
      ownerId: row.owner_id as string,
      maxMembers: row.max_members as number,
      members: members.map((m) => ({
        id: m.id as string,
        partyId: m.party_id as string,
        userId: m.user_id as string,
        role: m.role as "owner" | "admin" | "member",
        joinedAt: new Date(m.joined_at as string),
        profile: m.profiles
          ? {
              username: (m.profiles as Record<string, unknown>)
                .username as string,
              displayName: (m.profiles as Record<string, unknown>)
                .display_name as string | null,
              avatarUrl: (m.profiles as Record<string, unknown>).avatar_url as
                | string
                | null,
            }
          : undefined,
      })),
    };
  }

  return {
    fetchUserParties,
    createParty,
    joinByCode,
    fetchPartyById,
    leaveParty,
  };
}
