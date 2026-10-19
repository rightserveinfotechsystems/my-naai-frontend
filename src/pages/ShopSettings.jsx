import { useState, useEffect } from "react";
import { shopSettingsAPI } from "../services/communication";
import Layout from "../components/Layout.jsx";
import Loader from "../components/Loader.jsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal, Save, RotateCcw, Truck, Percent, Banknote, IndianRupee, ShieldCheck } from "lucide-react";

const FIELDS = [
  {
    key: "freeDeliveryAbove",
    label: "Free Shipping Threshold",
    prefix: "₹",
    max: 1000000,
    step: 1,
    hint: "Orders whose item total (after discount) reaches this are delivered FREE. Below it, the delivery charge applies.",
    icon: Truck,
  },
  {
    key: "deliveryFee",
    label: "Delivery Charges",
    prefix: "₹",
    max: 100000,
    step: 1,
    hint: "Flat delivery charge added to every order below the free-shipping threshold.",
    icon: IndianRupee,
  },
  {
    key: "discountPercent",
    label: "Discount Percentage",
    suffix: "%",
    max: 100,
    step: 0.5,
    hint: "Percentage off the whole item total on every order (0–100).",
    icon: Percent,
  },
  {
    key: "codThreshold",
    label: "COD Threshold",
    prefix: "₹",
    max: 10000000,
    step: 1,
    hint: "Maximum item total a customer may still pay by Cash on Delivery. Set 0 to allow COD on any order.",
    icon: Banknote,
  },
  {
    key: "codCharges",
    label: "COD Charges",
    prefix: "₹",
    max: 100000,
    step: 1,
    hint: "Extra fee charged when the customer chooses Cash on Delivery.",
    icon: ShieldCheck,
  },
];

const ShopSettings = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      const result = await shopSettingsAPI.get();
      if (result.success && result.data) {
        setValues(result.data);
      } else {
        toast.error(result.message || "Failed to load shop settings");
      }
    } catch {
      toast.error("Failed to load shop settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (localStorage.getItem("role") === "distributor") {
      navigate("/distributor", { replace: true });
      return;
    }
    const tab = JSON.parse(localStorage.getItem("accessTab") || "null");
    const hasShopAccess = ["shopProducts", "distributors", "shopOrders", "shopSettings"].some((key) => tab?.includes(key));
    if (!hasShopAccess) navigate("/login", { replace: true });
  }, [navigate]);

  const setField = (key, raw) => {
    let num = raw === "" ? "" : Number(raw);
    if (num !== "" && !Number.isFinite(num)) num = "";
    setValues((prev) => ({ ...prev, [key]: num }));
  };

  const handleSave = async () => {
    const payload = {};
    for (const f of FIELDS) {
      const raw = values?.[f.key];
      const num = raw === "" || raw === undefined || raw === null ? 0 : Number(raw);
      if (!Number.isFinite(num) || num < 0) {
        toast.error(`${f.label} must be a number of 0 or more.`);
        return;
      }
      if (f.max !== undefined && num > f.max) {
        toast.error(`${f.label} looks too large.`);
        return;
      }
      payload[f.key] = num;
    }
    try {
      setSaving(true);
      const result = await shopSettingsAPI.update(payload);
      if (result.success) {
        setValues(result.data || payload);
        toast.success("Shop settings saved successfully!");
      } else {
        toast.error(result.message || "Failed to save shop settings");
      }
    } catch {
      toast.error("Failed to save shop settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await load();
    toast.info("Reloaded saved settings.");
  };

  return (
    <Layout>
      <div style={{ padding: "16px", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>
        
        {/* Header Section */}
        <div style={{ background: "#ffffff", borderRadius: "16px", boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)", marginBottom: "20px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13, 110, 253, 0.1)", color: "#0d6efd", borderRadius: "12px", width: "48px", height: "48px", flexShrink: 0 }}>
              <SlidersHorizontal size={24} />
            </div>
            <div style={{ flex: "1 1 250px", minWidth: 0 }}>
              <h4 style={{ margin: "0 0 4px 0", fontWeight: "700", color: "#212529", fontSize: "1.2rem" }}>Shop Settings</h4>
              <p style={{ margin: 0, color: "#6c757d", fontSize: "0.85rem", lineHeight: "1.4" }}>
                Configure delivery charges, discounts, and Cash-on-Delivery rules for Naai Shop. Changes apply immediately to new orders.
              </p>
            </div>
          </div>
        </div>

        {/* Settings Body Section */}
        <div style={{ background: "#ffffff", borderRadius: "16px", boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)", padding: "24px" }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Loader size="md" />
              <p style={{ color: "#6c757d", marginTop: "12px", fontSize: "0.875rem" }}>Loading configuration...</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Fields Grid Layout */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                {FIELDS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div 
                      key={f.key} 
                      style={{ flex: "1 1 340px", minWidth: "280px", maxWidth: "100%", boxSizing: "border-box" }}
                    >
                      <div style={{ height: "100%", padding: "20px", border: "1px solid #e2e8f0", borderRadius: "14px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fafbfc", boxSizing: "border-box" }}>
                        <div>
                          {/* Label Header */}
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", width: "36px", height: "36px", color: "#0d6efd", flexShrink: 0 }}>
                              <Icon size={18} />
                            </span>
                            <label style={{ fontWeight: "700", color: "#212529", fontSize: "0.95rem", margin: 0 }}>
                              {f.label}
                            </label>
                          </div>

                          {/* Fixed Horizontal Input Group Container */}
                          <div style={{ display: "flex", alignItems: "stretch", width: "100%", marginBottom: "12px", borderRadius: "8px", overflow: "hidden", border: "1px solid #ced4da", background: "#ffffff", boxSizing: "border-box" }}>
                            {f.prefix && (
                              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "#f8f9fa", borderRight: "1px solid #ced4da", fontWeight: "600", color: "#495057", fontSize: "1rem", flexShrink: 0 }}>
                                {f.prefix}
                              </span>
                            )}
                            <input
                              type="number"
                              min="0"
                              step={f.step}
                              style={{ width: "100%", flex: "1 1 auto", border: "none", outline: "none", padding: "10px 14px", fontSize: "1rem", fontWeight: "500", color: "#212529", background: "transparent", minWidth: 0 }}
                              value={values?.[f.key] ?? ""}
                              onChange={(e) => setField(f.key, e.target.value)}
                              placeholder="0"
                              aria-label={f.label}
                            />
                            {f.suffix && (
                              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "#f8f9fa", borderLeft: "1px solid #ced4da", fontWeight: "600", color: "#495057", fontSize: "1rem", flexShrink: 0 }}>
                                {f.suffix}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hint Text */}
                        <div style={{ color: "#6c757d", fontSize: "0.825rem", lineHeight: "1.4", wordBreak: "break-word" }}>
                          {f.hint}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <hr style={{ margin: "16px 0", border: "0", borderTop: "1px solid rgba(0,0,0,0.1)" }} />

              {/* Action Buttons Footer */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    style={{ background: "#0d6efd", color: "#ffffff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
                  >
                    <Save size={16} /> 
                    {saving ? "Saving changes..." : "Save Settings"}
                  </button>
                  <button 
                    onClick={handleReset} 
                    disabled={saving}
                    style={{ background: "#ffffff", color: "#495057", border: "1px solid #ced4da", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: saving ? "not-allowed" : "pointer" }}
                  >
                    <RotateCcw size={16} /> 
                    Reload
                  </button>
                </div>

                <span style={{ color: "#6c757d", fontSize: "0.85rem" }}>
                  🔒 Changes sync instantly across the web shop & admin panel.
                </span>
              </div>

            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default ShopSettings;