import { useAuthStore } from "~~/stores/auth";
import type { Quest, QuestDifficulty } from "~~/domain/types";

export interface CreateQuestDTO {
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  exp_reward: number;
  is_recurring?: boolean;
  recurrence_pattern?: string;
}

export function useQuests() {
  const supabase = useSupabase();
  const authStore = useAuthStore();

  async function fetchQuests(): Promise<Quest[]> {
    if (!authStore.userId) return [];

    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", authStore.userId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map(mapDbToQuest);
  }

  async function fetchTodayCompletions(): Promise<string[]> {
    if (!authStore.userId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("quest_completions")
      .select("quest_id")
      .eq("user_id", authStore.userId)
      .gte("completed_at", today.toISOString());

    if (error) throw error;

    return (data ?? []).map((c) => c.quest_id);
  }

  async function createQuest(dto: CreateQuestDTO): Promise<Quest | null> {
    if (!authStore.userId) return null;

    const { data, error } = await supabase
      .from("quests")
      .insert({
        user_id: authStore.userId,
        title: dto.title,
        description: dto.description,
        difficulty: dto.difficulty,
        exp_reward: dto.exp_reward,
        is_recurring: dto.is_recurring ?? false,
        recurrence_pattern: dto.recurrence_pattern,
      })
      .select()
      .single();

    if (error) throw error;

    return data ? mapDbToQuest(data) : null;
  }

  async function completeQuest(
    questId: string,
    streakCount: number = 1
  ): Promise<number> {
    if (!authStore.userId) return 0;

    const quest = await getQuestById(questId);
    if (!quest) return 0;

    const expEarned = quest.exp;

    const { error: completionError } = await supabase
      .from("quest_completions")
      .insert({
        quest_id: questId,
        user_id: authStore.userId,
        exp_earned: expEarned,
        streak_count: streakCount,
      });

    if (completionError) throw completionError;

    await supabase
      .from("profiles")
      .update({
        total_exp: supabase.rpc ? undefined : undefined,
      })
      .eq("id", authStore.userId);

    await supabase.rpc("increment_exp", {
      user_id: authStore.userId,
      amount: expEarned,
    });

    return expEarned;
  }

  async function getQuestById(id: string): Promise<Quest | null> {
    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data ? mapDbToQuest(data) : null;
  }

  async function deleteQuest(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("quests")
      .update({ active: false })
      .eq("id", id);

    return !error;
  }

  function mapDbToQuest(row: Record<string, unknown>): Quest {
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      difficulty: row.difficulty as QuestDifficulty,
      exp: row.exp_reward as number,
      status: "pending",
      streak: 0,
      dueDate: null,
      createdAt: new Date(row.created_at as string),
      completedAt: null,
    };
  }

  return {
    fetchQuests,
    fetchTodayCompletions,
    createQuest,
    completeQuest,
    deleteQuest,
    getQuestById,
  };
}
