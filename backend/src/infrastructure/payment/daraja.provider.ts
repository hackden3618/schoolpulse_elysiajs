import {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
  MPESA_CONFIRMATION_URL,
  MPESA_VALIDATION_URL,
  MPESA_BASE_URL,
} from "@/config"
import { AppError } from "@/common/errors"
import { normalizePhone } from "@/common/validation"

export class DarajaProvider {
  /**
   * Fetch Access Token from Safaricom Daraja API
   */
  static async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64")
    
    try {
      const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Daraja API error: ${response.statusText}`)
      }
      
      const data: any = await response.json()
      return data.access_token
    } catch (error) {
      console.error("[DarajaProvider] Failed to get access token:", error)
      throw AppError.internal("Payment gateway unavailable")
    }
  }

  /**
   * Initiate STK Push (M-Pesa Express)
   */
  static async initiateStkPush({
    phoneNumber,
    amount,
    accountReference,
    transactionDesc,
  }: {
    phoneNumber: string
    amount: number
    accountReference: string
    transactionDesc: string
  }) {
    const token = await this.getAccessToken()
    
    // Safaricom requires format 2547XXXXXXXX
    const formattedPhone = normalizePhone(phoneNumber).replace(/^\+/, "")

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3)
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64")

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: accountReference.substring(0, 12),
      TransactionDesc: transactionDesc.substring(0, 13),
    }

    try {
      const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      
      const data: any = await response.json()
      
      if (data.ResponseCode !== "0") {
        throw new Error(`Daraja STK Push Error: ${data.errorMessage || data.ResponseDescription}`)
      }
      
      return data
    } catch (error: any) {
      console.error("[DarajaProvider] Failed to initiate STK push:", error)
      throw AppError.internal(error.message || "Failed to initiate payment")
    }
  }

  /**
   * Query the status of an STK Push that may not have called back yet.
   * Used by the reconciliation job to resolve payments stuck in `pending`.
   */
  static async queryStkPush({ checkoutRequestId }: { checkoutRequestId: string }) {
    const token = await this.getAccessToken()

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3)
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64")

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }

    try {
      const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpushquery/v1/processquery`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data: any = await response.json()
      return {
        resultCode: data.ResultCode,
        resultDesc: data.ResultDesc,
        merchantRequestId: data.MerchantRequestID,
        checkoutRequestId: data.CheckoutRequestID,
      }
    } catch (error: any) {
      console.error("[DarajaProvider] Failed to query STK push:", error)
      throw AppError.internal(error.message || "Failed to query payment status")
    }
  }

  /**
   * Registers the C2B Confirmation and Validation URLs with Safaricom.
   *
   * This is what makes M-Pesa Transaction Reversals (chargebacks / timeouts)
   * reach our system: Safaricom pushes them to the Confirmation URL. Without
   * this registration the reversal never arrives and a reversed payment stays
   * marked as confirmed (fees wrongly shown as paid).
   *
   * `ResponseType: "Completed"` tells Daraja to deliver the transaction to our
   * Confirmation URL first and queue it if we are briefly unreachable.
   */
  static async registerC2BUrls() {
    const token = await this.getAccessToken()

    const payload = {
      ShortCode: MPESA_SHORTCODE,
      ResponseType: "Completed",
      ConfirmationURL: MPESA_CONFIRMATION_URL,
      ValidationURL: MPESA_VALIDATION_URL,
    }

    try {
      const response = await fetch(`${MPESA_BASE_URL}/mpesa/c2b/v1/registerurl`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data: any = await response.json()
      if (data.ResponseCode !== "0") {
        throw new Error(`Daraja C2B register error: ${data.errorMessage || data.ResponseDescription}`)
      }
      console.info("[DarajaProvider] C2B URLs registered:", {
        confirmation: MPESA_CONFIRMATION_URL,
        validation: MPESA_VALIDATION_URL,
      })
      return data
    } catch (error: any) {
      // Non-fatal: the app can still initiate STK pushes and process callbacks.
      // Reversals/C2B payments will simply not be delivered until the URLs
      // are registered (done once via the Daraja portal or this call).
      console.warn("[DarajaProvider] C2B URL registration skipped:", error?.message || error)
    }
  }
}
