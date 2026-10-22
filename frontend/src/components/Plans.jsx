import React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Sparkles,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPaymentOrder, verifyPayment } from "../features/payment";

const plans = [
  {
    key: "free",
    name: "Free",
    description: "For trying out the AI IDE.",
    price: "₹0",
    period: "/month",
    credits: "100 AI credits",
    icon: Zap,
    theme: {
      accent: "text-brand-lime",
      bgBadge: "bg-brand-lime/10 border-brand-lime/20 text-brand-lime",
      iconBg: "bg-brand-lime text-night",
      btn: "border border-white/10 bg-white/[0.04] text-white/50 cursor-default",
      border: "border-white/10",
      pill: "bg-white/10 text-white/50",
    },
    features: [
      "50 AI credits / month",
      "AI code generation",
      "Project editor",
      "HTML / CSS / JS preview",
      "React preview",
      "Basic project management",
    ],
    button: "Current Plan",
    current: true,
  },
  {
    key: "pro",
    name: "Pro",
    description: "For developers who build regularly.",
    price: "₹299",
    period: "/month",
    credits: "500 AI credits",
    icon: Sparkles,
    popular: true,
    theme: {
      accent: "text-brand-orange",
      bgBadge: "bg-brand-orange/15 border-brand-orange/30 text-brand-orange",
      iconBg: "bg-brand-orange text-night",
      btn: "bg-brand-orange text-night hover:bg-white shadow-lg shadow-brand-orange/20",
      border: "border-brand-orange/40 bg-white/[0.03]",
      pill: "bg-brand-orange text-night",
    },
    features: [
      "500 AI credits / month",
      "Everything in Free",
      "Priority AI generation",
      "Larger projects",
      "Unlimited projects",
      "Advanced AI coding",
      "Priority support",
    ],
    button: "Upgrade to Pro",
  },
  {
    key: "team",
    name: "Team",
    description: "For teams building products together.",
    price: "₹799",
    period: "/month",
    credits: "2,000 AI credits",
    icon: Crown,
    theme: {
      accent: "text-brand-lavender",
      bgBadge: "bg-brand-lavender/15 border-brand-lavender/30 text-brand-lavender",
      iconBg: "bg-brand-lavender text-night",
      btn: "bg-brand-lavender text-night hover:bg-white shadow-lg shadow-brand-lavender/20",
      border: "border-brand-lavender/30 bg-white/[0.02]",
      pill: "bg-brand-lavender text-night",
    },
    features: [
      "2,000 AI credits / month",
      "Everything in Pro",
      "Team collaboration",
      "Shared projects",
      "Higher AI limits",
      "Priority processing",
      "Team support",
    ],
    button: "Upgrade to Team",
  },
];

export default function Plans() {
  const navigate = useNavigate();

  const handlePayment = async (plan) => {
    try {
      if (plan?.current || plan?.key === "free") {
        return;
      }

      if (!plan?.key) {
        console.error("Invalid plan:", plan);
        return;
      }

      const data = await createPaymentOrder(plan);

      console.log("CREATE ORDER RESPONSE:", data);

      if (!data?.success) {
        console.error(data?.message || "Unable to create payment order");
        return;
      }

      if (!data?.order?.id || !data?.keyId) {
        console.error("Invalid payment order response:", data);
        return;
      }

      if (!window.Razorpay) {
        console.error("Razorpay SDK is not loaded.");
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "nextCode",
        description: `${plan.name} Plan`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const result = await verifyPayment(response);

            console.log("VERIFY PAYMENT RESPONSE:", result);

            if (!result?.success) {
              console.error(result?.message || "Payment verification failed");
              return;
            }

            console.log("Payment successful:", result);
          } catch (error) {
            console.error("PAYMENT VERIFICATION ERROR:", error);
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Razorpay checkout closed");
          },
        },
        theme: {
          color: plan.key === "team" ? "#B8B5FF" : "#FF9B54",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("RAZORPAY PAYMENT FAILED:", response?.error);
      });

      razorpay.open();
    } catch (error) {
      console.error("PAYMENT ERROR:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="pointer-events-none fixed left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-brand-orange/[0.04] blur-[150px]" />
      <div className="pointer-events-none fixed right-1/4 top-10 h-[500px] w-[500px] rounded-full bg-brand-lavender/[0.05] blur-[150px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="font-display text-[20px] uppercase tracking-wide text-white">
            nextCode
          </div>
        </div>

        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-brand-lime/20 bg-brand-lime/10 px-3.5 py-1.5 text-xs font-semibold text-brand-lime">
            <Sparkles size={13} />
            Simple pricing for developers
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Build more.{" "}
            <span className="text-brand-lime">Ship faster.</span>
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/50">
            Choose a plan that gives you the AI credits you need to build and iterate faster.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => {
            const Icon = plan.icon;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${plan.theme.border}`}
              >
                {plan.popular && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${plan.theme.pill}`}
                  >
                    Most Popular
                  </div>
                )}

                <div
                  className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl font-bold ${plan.theme.iconBg}`}
                >
                  <Icon size={19} />
                </div>

                <h2 className="text-lg font-bold text-white">{plan.name}</h2>

                <p className="mt-1 min-h-[40px] text-xs leading-5 text-white/50">
                  {plan.description}
                </p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-3xl font-bold tracking-tight text-white">
                    {plan.price}
                  </span>
                  <span className="mb-1 text-xs text-white/40">{plan.period}</span>
                </div>

                <div
                  className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${plan.theme.bgBadge}`}
                >
                  <Zap size={14} className={plan.theme.accent} fill="currentColor" />
                  {plan.credits}
                </div>

                <button
                  disabled={plan.current}
                  onClick={() => handlePayment(plan)}
                  className={`mt-5 w-full rounded-xl py-2.5 text-xs font-bold transition-all ${plan.theme.btn}`}
                >
                  {plan.button}
                </button>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Includes
                  </p>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-xs text-white/70"
                      >
                        <Check size={14} className="mt-0.5 shrink-0 text-brand-green" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-[11px] text-white/40">
          Credits reset every month. Unused credits do not roll over.
        </div>
      </div>
    </div>
  );
}