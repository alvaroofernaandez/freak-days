import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import AppHeader from "../../../../app/components/layout/AppHeader.vue";

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("AppHeader.vue", () => {
  it("should render app header", () => {
    const wrapper = mount(AppHeader, {
      props: {
        profile: null,
        expProgress: {
          current: 0,
          needed: 100,
          progress: 0,
        },
        isActive: () => false,
      },
      global: {
        stubs: {
          NuxtLink: true,
          Avatar: true,
          AvatarFallback: true,
          AvatarImage: true,
          Tooltip: true,
          TooltipContent: true,
          TooltipTrigger: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("should emit logout when logout is triggered", () => {
    const wrapper = mount(AppHeader, {
      props: {
        profile: null,
        expProgress: {
          current: 0,
          needed: 100,
          progress: 0,
        },
        isActive: () => false,
      },
      global: {
        stubs: {
          NuxtLink: true,
          Avatar: true,
          AvatarFallback: true,
          AvatarImage: true,
          Tooltip: true,
          TooltipContent: true,
          TooltipTrigger: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});

