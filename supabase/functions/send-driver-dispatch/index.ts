const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DispatchRequest {
  phoneNumber: string;
  driverName: string;
  vehicleType: string;
  bookingRef: string;
  guestName: string;
  groupSize: number;
  pickup: string;
  bookingDate: string;
  bookingTime: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhoneNumber(phoneNumber: string): string {
  const normalized = phoneNumber.replace(/[^0-9]/g, "");
  if (normalized.length < 8 || normalized.length > 15) {
    throw new Error("Invalid driver phone number");
  }
  return normalized;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json() as Partial<DispatchRequest>;
    const requiredFields: (keyof DispatchRequest)[] = [
      "phoneNumber",
      "driverName",
      "vehicleType",
      "bookingRef",
      "guestName",
      "pickup",
      "bookingDate",
      "bookingTime",
    ];

    if (requiredFields.some((field) => !body[field])) {
      return jsonResponse({ error: "Missing dispatch details" }, 400);
    }

    if (!Number.isInteger(body.groupSize) || (body.groupSize as number) < 1) {
      return jsonResponse({ error: "Invalid group size" }, 400);
    }

    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const templateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME");
    const templateLanguage = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") ?? "en_US";

    if (!accessToken || !phoneNumberId || !templateName) {
      return jsonResponse({ error: "WhatsApp messaging is not configured" }, 503);
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhoneNumber(body.phoneNumber as string),
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: body.driverName },
                { type: "text", text: body.bookingRef },
                { type: "text", text: `${body.guestName} (${body.groupSize} pax)` },
                { type: "text", text: body.pickup },
                { type: "text", text: `${body.bookingDate} at ${body.bookingTime}` },
                { type: "text", text: body.vehicleType },
              ],
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      console.error("WhatsApp API rejected dispatch", response.status, await response.text());
      return jsonResponse({ error: "WhatsApp rejected the dispatch message" }, 502);
    }

    const result = await response.json() as { messages?: Array<{ id?: string }> };
    return jsonResponse({ messageId: result.messages?.[0]?.id ?? null });
  } catch (error) {
    console.error("Driver dispatch failed", error);
    return jsonResponse({ error: "Could not send the dispatch message" }, 500);
  }
});
