import { createProvider } from '@builderbot/bot'
import { TwilioProvider } from '@builderbot/provider-twilio'

export const provider = createProvider(TwilioProvider, {
    accountSid: "ACd3fd9a0f4e07df8510c3b002c8504271",
    authToken: "6eee906efa6920a117ba50d4a43fc02b",
    vendorNumber: "+14174907654",
  });
