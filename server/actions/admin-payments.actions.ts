"use server";

import { createServerClient } from "@/lib/supabase-server";
import * as Sentry from "@sentry/nextjs";

export interface PaymentTransaction {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  stripe_payment_intent_id: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  order: {
    id: string;
    purchase_type: string;
    order_items: Array<{
      course_id: string | null;
      bundle_id: string | null;
      courses: { title: string } | null;
      bundles: { name: string } | null;
    }>;
  } | null;
}

export interface PaymentStats {
  totalTransactions: number;
  successfulPayments: number;
  failedPayments: number;
  totalRevenue: number;
  averageOrderValue: number;
  refundedAmount: number;
}

export const getAllPaymentTransactions = async (limit: number = 50) => {
  return Sentry.startSpan(
    {
      op: "function.server",
      name: "getAllPaymentTransactions",
    },
    async (span) => {
      try {
        const supabase = await createServerClient();

        const { data: payments, error } = await supabase
          .from("payments")
          .select(
            `
            id,
            amount_cents,
            status,
            provider,
            provider_payment_id,
            created_at,
            orders!inner(
              id,
              user_id,
              purchase_type,
              profiles(id, email, full_name),
              order_items(
                course_id,
                bundle_id,
                courses(title),
                bundles(name)
              )
            )
          `
          )
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          Sentry.captureException(error);
          console.error("Error fetching payment transactions:", error);
          return { success: false, error: error.message };
        }

        // Transform the data to match our interface
        const transactions: PaymentTransaction[] =
          payments?.map((payment: any) => {
            const order = payment.orders;
            const profile = order?.profiles;
            const orderItems = order?.order_items || [];

            return {
              id: payment.id,
              amount: payment.amount_cents,
              status: payment.status,
              payment_method: payment.provider || "stripe",
              stripe_payment_intent_id: payment.provider_payment_id || "",
              created_at: payment.created_at,
              user: profile
                ? {
                    id: profile.id,
                    email: profile.email,
                    full_name: profile.full_name,
                  }
                : null,
              order: order
                ? {
                    id: order.id,
                    purchase_type: order.purchase_type,
                    order_items: orderItems.map((item: any) => ({
                      course_id: item.course_id,
                      bundle_id: item.bundle_id,
                      courses: item.courses,
                      bundles: item.bundles,
                    })),
                  }
                : null,
            };
          }) || [];

        span?.setAttribute("transactionCount", transactions.length);
        const { logger } = Sentry;
        logger.info(logger.fmt`Fetched ${transactions.length} payment transactions`);

        return { success: true, data: transactions };
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error in getAllPaymentTransactions:", error);
        return { success: false, error: "Failed to fetch payment transactions" };
      }
    }
  );
};

export const getPaymentStats = async () => {
  return Sentry.startSpan(
    {
      op: "function.server",
      name: "getPaymentStats",
    },
    async (span) => {
      try {
        const supabase = await createServerClient();

        // Get all payments
        const { data: payments, error } = await supabase.from("payments").select("amount_cents, status");

        if (error) {
          Sentry.captureException(error);
          console.error("Error fetching payment stats:", error);
          return { success: false, error: error.message };
        }

        const totalTransactions = payments?.length || 0;
        const successfulPayments = payments?.filter((p) => p.status === "succeeded").length || 0;
        const failedPayments = payments?.filter((p) => p.status === "failed").length || 0;
        const totalRevenue =
          payments?.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;
        const refundedAmount =
          payments?.filter((p) => p.status === "refunded").reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;
        const averageOrderValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

        const stats: PaymentStats = {
          totalTransactions,
          successfulPayments,
          failedPayments,
          totalRevenue,
          averageOrderValue,
          refundedAmount,
        };

        span?.setAttribute("totalRevenue", totalRevenue);
        span?.setAttribute("successfulPayments", successfulPayments);
        const { logger } = Sentry;
        logger.info(logger.fmt`Payment stats fetched: ${successfulPayments} successful payments`);

        return { success: true, data: stats };
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error in getPaymentStats:", error);
        return { success: false, error: "Failed to fetch payment stats" };
      }
    }
  );
};

export const processRefund = async (paymentId: string, reason?: string) => {
  return Sentry.startSpan(
    {
      op: "function.server",
      name: "processRefund",
    },
    async (span) => {
      try {
        const supabase = await createServerClient();

        // Get payment details
        const { data: payment, error: fetchError } = await supabase
          .from("payments")
          .select("provider_payment_id, status, amount_cents")
          .eq("id", paymentId)
          .single();

        if (fetchError || !payment) {
          Sentry.captureException(fetchError);
          console.error("Error fetching payment:", fetchError);
          return { success: false, error: "Payment not found" };
        }

        if (payment.status !== "succeeded") {
          return { success: false, error: "Can only refund successful payments" };
        }

        // Update payment status to refunded
        const { error: updateError } = await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("id", paymentId);

        if (updateError) {
          Sentry.captureException(updateError);
          console.error("Error updating payment status:", updateError);
          return { success: false, error: updateError.message };
        }

        span?.setAttribute("paymentId", paymentId);
        span?.setAttribute("refundAmount", payment.amount_cents);
        const { logger } = Sentry;
        logger.info(logger.fmt`Refund processed for payment ${paymentId}: $${payment.amount_cents / 100}`);

        return {
          success: true,
          message: `Refund of $${payment.amount_cents / 100} processed successfully`,
        };
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error in processRefund:", error);
        return { success: false, error: "Failed to process refund" };
      }
    }
  );
};
