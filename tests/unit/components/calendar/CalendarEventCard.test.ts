import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CalendarEventCard from "../../../../app/components/calendar/CalendarEventCard.vue";

describe("CalendarEventCard.vue", () => {
  it("should render component", () => {
    const wrapper = mount(CalendarEventCard, {
      props: {
        release: {
          id: "1",
          title: "Test Event",
          type: "anime_episode",
          release_date: new Date(),
          user_id: "user1",
          created_at: new Date().toISOString(),
        },
      },
      global: {
        stubs: {
          Button: true,
          Card: true,
          CardContent: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
