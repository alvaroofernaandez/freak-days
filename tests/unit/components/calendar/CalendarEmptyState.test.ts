import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CalendarEmptyState from "../../../../app/components/calendar/CalendarEmptyState";

describe("CalendarEmptyState.vue", () => {
  it("should render component", () => {
    const wrapper = mount(CalendarEmptyState, {
      global: {
        stubs: {
          NuxtLink: true,
          Button: true,
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true,
          CardDescription: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
