import { useAuthStore } from "~~/stores/auth";
import { useToast } from "@/composables/useToast";

export interface Party {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string | null;
  ownerId: string;
  maxMembers: number;
  createdAt: Date;
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
  const toast = useToast();

  async function fetchUserParties(): Promise<Party[]> {
    if (!authStore.userId) return [];

    try {
      const { data: memberships, error } = await supabase
        .from("party_members")
        .select("party_id")
        .eq("user_id", authStore.userId)
        .order("joined_at", { ascending: false });

      if (error) {
        console.error("Error fetching party memberships:", error);
        throw error;
      }

      if (!memberships || memberships.length === 0) {
        return [];
      }

      const partyIds = memberships.map((m) => m.party_id);

      const { data: partiesData, error: partiesError } = await supabase
        .from("parties")
        .select("*")
        .in("id", partyIds);

      if (partiesError) {
        console.error("Error fetching parties:", partiesError);
        throw partiesError;
      }

      if (!partiesData || partiesData.length === 0) {
        return [];
      }

      const partiesWithMembers = await Promise.all(
        partiesData.map(async (party) => {
          const { data: members, error: membersError } = await supabase
            .from("party_members")
            .select(
              `
              *,
              profiles (username, display_name, avatar_url)
            `
            )
            .eq("party_id", party.id);

          if (membersError) {
            console.error(`Error fetching members for party ${party.id}:`, membersError);
            return { ...party, party_members: [] };
          }

          return { ...party, party_members: members || [] };
        })
      );

      return partiesWithMembers.map((p) => mapDbToParty(p));
    } catch (error) {
      console.error("Error in fetchUserParties:", error);
      return [];
    }
  }

  async function createParty(
    name: string,
    description?: string
  ): Promise<Party | null> {
    if (!authStore.userId) {
      toast.error("Debes estar autenticado para crear una party");
      return null;
    }

    if (!name.trim()) {
      toast.error("El nombre de la party es obligatorio");
      return null;
    }

    if (name.length > 50) {
      toast.error("El nombre no puede tener más de 50 caracteres");
      return null;
    }

    try {
      let inviteCode = generateInviteCode();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from("parties")
          .select("id")
          .eq("invite_code", inviteCode)
          .single();

        if (!existing) break;

        inviteCode = generateInviteCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        toast.error("Error al generar código de invitación único");
        return null;
      }

      const { data: party, error: partyError } = await supabase
        .from("parties")
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          owner_id: authStore.userId,
          invite_code: inviteCode,
          max_members: 10,
        })
        .select()
        .single();

      if (partyError) {
        console.error("Error creating party:", partyError);
        toast.error("Error al crear la party");
        throw partyError;
      }

      if (!party) {
        toast.error("No se pudo crear la party");
        return null;
      }

      const { error: memberError } = await supabase
        .from("party_members")
        .insert({
          party_id: party.id,
          user_id: authStore.userId,
          role: "owner",
        });

      if (memberError) {
        console.error("Error adding owner to party:", memberError);
        toast.error("Error al añadirte como miembro");
        throw memberError;
      }

      const createdParty = await fetchPartyById(party.id);
      if (createdParty) {
        toast.success("Party creada correctamente");
      }
      return createdParty;
    } catch (error) {
      console.error("Error in createParty:", error);
      return null;
    }
  }

  async function joinByCode(code: string): Promise<Party | null> {
    if (!authStore.userId) {
      toast.error("Debes estar autenticado para unirte a una party");
      return null;
    }

    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length !== 6) {
      toast.error("El código debe tener 6 caracteres");
      return null;
    }

    try {
      const { data: party, error: findError } = await supabase
        .from("parties")
        .select("*")
        .eq("invite_code", normalizedCode)
        .single();

      if (findError || !party) {
        toast.error("Código de invitación inválido");
        return null;
      }

      const { data: existingMember } = await supabase
        .from("party_members")
        .select("id")
        .eq("party_id", party.id)
        .eq("user_id", authStore.userId)
        .single();

      if (existingMember) {
        toast.error("Ya eres miembro de esta party");
        return null;
      }

      const { data: memberCount } = await supabase
        .from("party_members")
        .select("id", { count: "exact", head: true })
        .eq("party_id", party.id);

      if (memberCount && (memberCount as any).length >= party.max_members) {
        toast.error("La party ha alcanzado el límite de miembros");
        return null;
      }

      const { error: joinError } = await supabase
        .from("party_members")
        .insert({
          party_id: party.id,
          user_id: authStore.userId,
          role: "member",
        });

      if (joinError) {
        if (joinError.code === "23505") {
          toast.error("Ya eres miembro de esta party");
        } else {
          console.error("Error joining party:", joinError);
          toast.error("Error al unirte a la party");
        }
        throw joinError;
      }

      const joinedParty = await fetchPartyById(party.id);
      if (joinedParty) {
        toast.success(`Te has unido a "${party.name}"`);
      }
      return joinedParty;
    } catch (error) {
      console.error("Error in joinByCode:", error);
      return null;
    }
  }

  async function fetchPartyById(id: string): Promise<Party | null> {
    try {
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

      if (error) {
        console.error("Error fetching party:", error);
        return null;
      }

      return data ? mapDbToParty(data) : null;
    } catch (error) {
      console.error("Error in fetchPartyById:", error);
      return null;
    }
  }

  async function leaveParty(partyId: string): Promise<boolean> {
    if (!authStore.userId) {
      toast.error("Debes estar autenticado");
      return false;
    }

    try {
      const { data: party } = await supabase
        .from("parties")
        .select("owner_id")
        .eq("id", partyId)
        .single();

      if (party && party.owner_id === authStore.userId) {
        toast.error("El dueño no puede abandonar la party. Elimínala si quieres cerrarla");
        return false;
      }

      const { error } = await supabase
        .from("party_members")
        .delete()
        .eq("party_id", partyId)
        .eq("user_id", authStore.userId);

      if (error) {
        console.error("Error leaving party:", error);
        toast.error("Error al salir de la party");
        return false;
      }

      toast.success("Has salido de la party");
      return true;
    } catch (error) {
      console.error("Error in leaveParty:", error);
      return false;
    }
  }

  async function regenerateInviteCode(partyId: string): Promise<string | null> {
    if (!authStore.userId) {
      toast.error("Debes estar autenticado");
      return null;
    }

    try {
      const { data: party } = await supabase
        .from("parties")
        .select("owner_id")
        .eq("id", partyId)
        .single();

      if (!party || party.owner_id !== authStore.userId) {
        toast.error("Solo el dueño puede regenerar el código");
        return null;
      }

      let newCode = generateInviteCode();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from("parties")
          .select("id")
          .eq("invite_code", newCode)
          .neq("id", partyId)
          .single();

        if (!existing) break;

        newCode = generateInviteCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        toast.error("Error al generar nuevo código");
        return null;
      }

      const { error } = await supabase
        .from("parties")
        .update({ invite_code: newCode })
        .eq("id", partyId)
        .eq("owner_id", authStore.userId);

      if (error) {
        console.error("Error regenerating code:", error);
        toast.error("Error al regenerar el código");
        return null;
      }

      toast.success("Código de invitación regenerado");
      return newCode;
    } catch (error) {
      console.error("Error in regenerateInviteCode:", error);
      return null;
    }
  }

  async function removeMember(partyId: string, memberId: string): Promise<boolean> {
    if (!authStore.userId) {
      toast.error("Debes estar autenticado");
      return false;
    }

    try {
      const { data: party } = await supabase
        .from("parties")
        .select("owner_id")
        .eq("id", partyId)
        .single();

      if (!party || party.owner_id !== authStore.userId) {
        toast.error("Solo el dueño puede expulsar miembros");
        return false;
      }

      const { data: member } = await supabase
        .from("party_members")
        .select("user_id, role")
        .eq("id", memberId)
        .eq("party_id", partyId)
        .single();

      if (!member) {
        toast.error("Miembro no encontrado");
        return false;
      }

      if (member.user_id === authStore.userId) {
        toast.error("No puedes expulsarte a ti mismo");
        return false;
      }

      if (member.role === "owner") {
        toast.error("No puedes expulsar al dueño");
        return false;
      }

      const { error } = await supabase
        .from("party_members")
        .delete()
        .eq("id", memberId)
        .eq("party_id", partyId);

      if (error) {
        console.error("Error removing member:", error);
        toast.error("Error al expulsar al miembro");
        return false;
      }

      toast.success("Miembro expulsado correctamente");
      return true;
    } catch (error) {
      console.error("Error in removeMember:", error);
      return false;
    }
  }

  async function deleteParty(partyId: string): Promise<boolean> {
    if (!authStore.userId) {
      toast.error("Debes estar autenticado");
      return false;
    }

    try {
      const { error } = await supabase
        .from("parties")
        .delete()
        .eq("id", partyId)
        .eq("owner_id", authStore.userId);

      if (error) {
        console.error("Error deleting party:", error);
        toast.error("Error al eliminar la party");
        return false;
      }

      toast.success("Party eliminada correctamente");
      return true;
    } catch (error) {
      console.error("Error in deleteParty:", error);
      return false;
    }
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
      createdAt: new Date(row.created_at as string),
      members: members
        .map((m) => ({
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
        }))
        .sort((a, b) => {
          if (a.role === "owner") return -1;
          if (b.role === "owner") return 1;
          if (a.role === "admin") return -1;
          if (b.role === "admin") return 1;
          return a.joinedAt.getTime() - b.joinedAt.getTime();
        }),
    };
  }

  return {
    fetchUserParties,
    createParty,
    joinByCode,
    fetchPartyById,
    leaveParty,
    regenerateInviteCode,
    removeMember,
    deleteParty,
  };
}
