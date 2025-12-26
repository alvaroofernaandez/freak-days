import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PartyCard from "../../../../app/components/party/PartyCard";

describe("PartyCard.vue", () => {
  it("should render component", () => {
    const wrapper = mount(PartyCard, {
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
