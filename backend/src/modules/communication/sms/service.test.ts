import { describe, it, expect } from "bun:test";
import { buildSettings, getSmsSettings } from "./service";

describe("SMS settings helpers", () => {
  it("returns no templates when settings is missing or invalid", () => {
    expect(getSmsSettings(undefined).templates).toEqual([]);
    expect(getSmsSettings(null).templates).toEqual([]);
    expect(getSmsSettings([]).templates).toEqual([]);
    expect(getSmsSettings({ sms: "invalid" }).templates).toEqual([]);
    expect(getSmsSettings({ sms: { templates: "invalid" } }).templates).toEqual([]);
  });

  it("returns existing sms templates when settings are valid", () => {
    const settings = {
      sms: {
        templates: [
          {
            id: "template-1",
            name: "Reminder",
            message: "Class starts at 8 AM",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    };

    expect(getSmsSettings(settings).templates).toEqual(settings.sms.templates);
  });

  it("buildSettings preserves non-sms fields and writes sms templates", () => {
    const original = {
      timezone: "Africa/Nairobi",
      currency: "KES",
      sms: {
        optIn: true,
      },
    };
    const templates = [
      {
        id: "template-2",
        name: "Welcome",
        message: "Welcome to SchoolPulse",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const result = buildSettings(original, templates);
    expect(result.timezone).toBe("Africa/Nairobi");
    expect(result.currency).toBe("KES");
    expect(result.sms).toEqual({ optIn: true, templates });
  });
});
