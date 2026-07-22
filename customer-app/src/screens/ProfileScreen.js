import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Lock,
  LogOut,
  Check,
  Edit3,
  Save,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Trash2,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const { width } = Dimensions.get("window");

const CARD_STORE_KEY   = "@cleaniq_saved_card";
const ADDRESS_STORE_KEY = "@cleaniq_saved_address";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const maskCard = (num) => {
  const clean = num.replace(/\s/g, "");
  if (clean.length < 4) return num;
  return "•••• •••• •••• " + clean.slice(-4);
};

const formatCardInput = (val) => {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

// ─── Field row ────────────────────────────────────────────────────────────────
const Field = ({
  Icon: IconComp,
  label,
  value,
  onChangeText,
  editable = true,
  keyboardType = "default",
  autoCapitalize = "words",
  secureTextEntry = false,
  rightIcon,
  onRightPress,
  placeholder,
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldRow, !editable && styles.fieldRowLocked]}>
      {IconComp && (
        <View style={styles.fieldIcon}>
          <IconComp size={16} color={editable ? C.primary : C.textMuted} />
        </View>
      )}
      <TextInput
        style={[styles.fieldInput, !editable && styles.fieldInputLocked]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder || ""}
        placeholderTextColor={C.textMuted}
        autoCorrect={false}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={styles.fieldRightIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, subtitle, children, action, actionLabel }) => (
  <View style={[styles.section, cardShadow]}>
    <View style={styles.sectionHead}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
      </View>
      {action && (
        <TouchableOpacity onPress={action} style={styles.sectionAction}>
          <Text style={styles.sectionActionTxt}>{actionLabel || "Edit"}</Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.sectionAccentLine} />
    {children}
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
const ProfileScreen = ({ navigation }) => {
  const { customerInfo, userToken, updateProfile, logout } = useContext(AuthContext);

  if (!userToken) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <User size={48} color={C.textMuted} strokeWidth={1.2} />
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 16, textAlign: "center" }}>Sign in to view your profile</Text>
        <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 8, textAlign: "center", lineHeight: 20 }}>Log in or create a free account to manage your profile and settings.</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={{ marginTop: 28, backgroundColor: C.primary, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 40 }}
          activeOpacity={0.85}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Log In / Sign Up</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Personal info state
  const [firstName, setFirstName] = useState(customerInfo?.firstName || "");
  const [lastName,  setLastName]  = useState(customerInfo?.lastName  || "");
  const [phone,     setPhone]     = useState(customerInfo?.phone     || "");
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo,  setSavingInfo]  = useState(false);

  // Saved address state
  const [address,     setAddress]     = useState("");
  const [postcode,    setPostcode]    = useState("");
  const [editingAddr, setEditingAddr] = useState(false);
  const [savingAddr,  setSavingAddr]  = useState(false);

  // Saved card state
  const [cardHolder,  setCardHolder]  = useState("");
  const [cardNumber,  setCardNumber]  = useState("");
  const [cardExpiry,  setCardExpiry]  = useState("");
  const [editingCard, setEditingCard] = useState(false);
  const [savingCard,  setSavingCard]  = useState(false);
  const [showCardNum, setShowCardNum] = useState(false);

  // Password change state
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [editingPwd,  setEditingPwd]  = useState(false);

  // Load saved address + card from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const savedAddr = await AsyncStorage.getItem(ADDRESS_STORE_KEY);
        if (savedAddr) {
          const { address: a, postcode: p } = JSON.parse(savedAddr);
          setAddress(a || "");
          setPostcode(p || "");
        }
        const savedCard = await AsyncStorage.getItem(CARD_STORE_KEY);
        if (savedCard) {
          const { cardHolder: ch, cardNumber: cn, cardExpiry: ce } = JSON.parse(savedCard);
          setCardHolder(ch || "");
          setCardNumber(cn || "");
          setCardExpiry(ce || "");
        }
      } catch {}
    })();
  }, []);

  const initials = [customerInfo?.firstName?.[0], customerInfo?.lastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || "U";

  // ── Save personal info ────────────────────────────────────────────────────
  const savePersonalInfo = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      return Alert.alert("Required", "First and last name cannot be empty.");
    }
    setSavingInfo(true);
    const res = await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });
    setSavingInfo(false);
    if (res.success) {
      setEditingInfo(false);
      Alert.alert("Saved", "Your personal details have been updated.");
    } else {
      Alert.alert("Error", res.message);
    }
  };

  // ── Save address ──────────────────────────────────────────────────────────
  const saveAddress = async () => {
    if (!address.trim()) return Alert.alert("Required", "Please enter your address.");
    if (!postcode.trim()) return Alert.alert("Required", "Please enter your postcode.");
    setSavingAddr(true);
    await AsyncStorage.setItem(ADDRESS_STORE_KEY, JSON.stringify({ address: address.trim(), postcode: postcode.trim().toUpperCase() }));
    setSavingAddr(false);
    setEditingAddr(false);
    Alert.alert("Saved", "Your address has been saved. It will auto-fill on your next booking.");
  };

  // ── Save card (local only) ────────────────────────────────────────────────
  const saveCard = async () => {
    if (!cardHolder.trim())  return Alert.alert("Required", "Please enter the cardholder name.");
    if (cardNumber.replace(/\s/g, "").length < 13) return Alert.alert("Invalid", "Please enter a valid card number.");
    if (!cardExpiry.trim())  return Alert.alert("Required", "Please enter the expiry date (MM/YY).");
    setSavingCard(true);
    await AsyncStorage.setItem(CARD_STORE_KEY, JSON.stringify({
      cardHolder: cardHolder.trim(),
      cardNumber: cardNumber.replace(/\s/g, ""),
      cardExpiry: cardExpiry.trim(),
    }));
    setSavingCard(false);
    setEditingCard(false);
    Alert.alert("Card saved", "Your card details are stored securely on this device.");
  };

  const removeCard = async () => {
    Alert.alert("Remove card?", "This will delete your saved card from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(CARD_STORE_KEY);
          setCardHolder(""); setCardNumber(""); setCardExpiry("");
          setEditingCard(false);
        },
      },
    ]);
  };

  // ── Change password ───────────────────────────────────────────────────────
  const changePassword = async () => {
    if (!currentPwd || !newPwd) return Alert.alert("Required", "Please fill in all password fields.");
    if (newPwd.length < 6)       return Alert.alert("Too short", "New password must be at least 6 characters.");
    if (newPwd !== confirmPwd)   return Alert.alert("Mismatch", "New passwords do not match.");
    setChangingPwd(true);
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await fetch(`${API_URL}/customer-auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      setChangingPwd(false);
      setEditingPwd(false);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      Alert.alert("Password updated", "Your password has been changed successfully.");
    } catch (err) {
      setChangingPwd(false);
      Alert.alert("Failed", "Could not change password.");
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const [deletingAccount, setDeletingAccount] = useState(false);

  const deleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your personal data. This cannot be undone.\n\nYour booking history will be anonymised.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            try {
              const token = await AsyncStorage.getItem("customerToken");
              const res = await fetch(`${API_URL}/customer-auth/account`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.message || "Failed to delete account");
              Alert.alert("Account Deleted", "Your account has been permanently deleted.", [
                { text: "OK", onPress: logout },
              ]);
            } catch (err) {
              Alert.alert("Error", err.message || "Could not delete account. Please try again.");
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  // ── Visual card ───────────────────────────────────────────────────────────
  const hasCard     = cardNumber.replace(/\s/g, "").length >= 4;
  const displayNum  = showCardNum ? formatCardInput(cardNumber) : maskCard(cardNumber);
  const hasAddress  = address.trim() && postcode.trim();

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <LinearGradient colors={["#0F6B4C", "#083d2b"]} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.avatarWrap}>
              <LinearGradient colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.1)"]} style={styles.avatarGrad}>
                <Text style={styles.avatarTxt}>{initials}</Text>
              </LinearGradient>
              <View style={styles.avatarBadge}>
                <Shield size={10} color={C.primary} />
              </View>
            </View>
            <Text style={styles.headerName}>{customerInfo?.firstName} {customerInfo?.lastName}</Text>
            <Text style={styles.headerEmail}>{customerInfo?.email}</Text>
            <View style={styles.headerStatRow}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatVal}>{hasAddress ? "1" : "0"}</Text>
                <Text style={styles.headerStatLbl}>Address</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatVal}>{hasCard ? "1" : "0"}</Text>
                <Text style={styles.headerStatLbl}>Card</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatVal}>Active</Text>
                <Text style={styles.headerStatLbl}>Status</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.body}>

            {/* ── Personal Information ─────────────────────────────────── */}
            <SectionCard
              title="Personal Information"
              subtitle="Your name and contact details"
              action={() => { if (editingInfo) savePersonalInfo(); else setEditingInfo(true); }}
              actionLabel={savingInfo ? "Saving..." : editingInfo ? "Save" : "Edit"}
            >
              <Field
                Icon={User} label="First name"
                value={firstName} onChangeText={setFirstName}
                editable={editingInfo} autoCapitalize="words"
              />
              <Field
                Icon={User} label="Last name"
                value={lastName} onChangeText={setLastName}
                editable={editingInfo} autoCapitalize="words"
              />
              <Field
                Icon={Mail} label="Email address"
                value={customerInfo?.email || ""} editable={false}
                autoCapitalize="none" keyboardType="email-address"
              />
              <Field
                Icon={Phone} label="Phone number"
                value={phone} onChangeText={setPhone}
                editable={editingInfo} keyboardType="phone-pad"
                autoCapitalize="none" placeholder="e.g. +44 7700 000000"
              />
              {editingInfo && (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setEditingInfo(false);
                      setFirstName(customerInfo?.firstName || "");
                      setLastName(customerInfo?.lastName   || "");
                      setPhone(customerInfo?.phone         || "");
                    }}
                  >
                    <Text style={styles.cancelBtnTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={savePersonalInfo} disabled={savingInfo}>
                    {savingInfo
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Save size={15} color="#fff" /><Text style={styles.saveBtnTxt}>Save Changes</Text></>}
                  </TouchableOpacity>
                </View>
              )}
            </SectionCard>

            {/* ── Saved Address ─────────────────────────────────────────── */}
            <SectionCard
              title="Saved Address"
              subtitle="Auto-fills when you make a booking"
              action={() => { if (editingAddr) saveAddress(); else setEditingAddr(true); }}
              actionLabel={savingAddr ? "Saving..." : editingAddr ? "Save" : hasAddress ? "Edit" : "Add"}
            >
              {!editingAddr && !hasAddress ? (
                <TouchableOpacity style={styles.emptyState} onPress={() => setEditingAddr(true)}>
                  <View style={styles.emptyIcon}>
                    <MapPin size={22} color={C.textMuted} />
                  </View>
                  <Text style={styles.emptyTxt}>No address saved yet</Text>
                  <Text style={styles.emptySubTxt}>Add your home address to skip typing it every booking</Text>
                  <View style={styles.addBtn}>
                    <Text style={styles.addBtnTxt}>Add Address</Text>
                  </View>
                </TouchableOpacity>
              ) : !editingAddr ? (
                <View style={styles.savedAddressBox}>
                  <View style={styles.savedAddressIcon}>
                    <MapPin size={18} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedAddressLine}>{address}</Text>
                    <Text style={styles.savedAddressPostcode}>{postcode}</Text>
                  </View>
                  <View style={styles.savedAddressBadge}>
                    <Check size={12} color="#10B981" strokeWidth={3} />
                    <Text style={styles.savedAddressBadgeTxt}>Saved</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Field
                    Icon={MapPin} label="Street address"
                    value={address} onChangeText={setAddress}
                    editable placeholder="e.g. 14 Brook Street, Manchester"
                  />
                  <Field
                    Icon={MapPin} label="Postcode"
                    value={postcode}
                    onChangeText={(v) => setPostcode(v.toUpperCase())}
                    editable placeholder="e.g. M1 1AA"
                    autoCapitalize="characters"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingAddr(false)}>
                      <Text style={styles.cancelBtnTxt}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={saveAddress} disabled={savingAddr}>
                      {savingAddr
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <><Save size={15} color="#fff" /><Text style={styles.saveBtnTxt}>Save Address</Text></>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </SectionCard>

            {/* ── Payment Card ──────────────────────────────────────────── */}
            <SectionCard
              title="Payment Method"
              subtitle="Card details stored securely on this device"
              action={() => { if (editingCard) saveCard(); else setEditingCard(!editingCard); }}
              actionLabel={savingCard ? "Saving..." : editingCard ? "Save" : hasCard ? "Edit" : "Add"}
            >
              {/* Visual card */}
              {hasCard && !editingCard && (
                <LinearGradient
                  colors={["#1A1A2E", "#16213E", "#0F3460"]}
                  style={styles.cardVisual}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardChip} />
                  <View style={styles.cardRow}>
                    <Text style={styles.cardNumDisplay}>{displayNum}</Text>
                    <TouchableOpacity onPress={() => setShowCardNum((v) => !v)}>
                      {showCardNum
                        ? <EyeOff size={16} color="rgba(255,255,255,0.5)" />
                        : <Eye size={16} color="rgba(255,255,255,0.5)" />}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardBottomRow}>
                    <View>
                      <Text style={styles.cardFieldLabel}>CARD HOLDER</Text>
                      <Text style={styles.cardFieldVal}>{cardHolder.toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.cardFieldLabel}>EXPIRES</Text>
                      <Text style={styles.cardFieldVal}>{cardExpiry}</Text>
                    </View>
                    <View style={styles.cardBrand}>
                      <View style={[styles.cardBrandCircle, { backgroundColor: "#EB001B", marginRight: -10 }]} />
                      <View style={[styles.cardBrandCircle, { backgroundColor: "#F79E1B" }]} />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.removeCardBtn} onPress={removeCard}>
                    <Text style={styles.removeCardTxt}>Remove card</Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}

              {/* Edit / add form */}
              {editingCard && (
                <>
                  <Field
                    Icon={User} label="Cardholder name"
                    value={cardHolder} onChangeText={setCardHolder}
                    editable autoCapitalize="words"
                    placeholder="Name as on card"
                  />
                  <Field
                    Icon={CreditCard} label="Card number"
                    value={formatCardInput(cardNumber)}
                    onChangeText={(v) => setCardNumber(v.replace(/\s/g, ""))}
                    editable keyboardType="numeric" autoCapitalize="none"
                    placeholder="1234 5678 9012 3456"
                    secureTextEntry={!showCardNum}
                    rightIcon={showCardNum
                      ? <EyeOff size={16} color={C.textMuted} />
                      : <Eye    size={16} color={C.textMuted} />}
                    onRightPress={() => setShowCardNum((v) => !v)}
                  />
                  <Field
                    Icon={Calendar} label="Expiry date"
                    value={cardExpiry}
                    onChangeText={(v) => {
                      const digits = v.replace(/\D/g, "").slice(0, 4);
                      setCardExpiry(digits.length > 2 ? digits.slice(0,2) + "/" + digits.slice(2) : digits);
                    }}
                    editable keyboardType="numeric" autoCapitalize="none"
                    placeholder="MM/YY"
                  />
                  <View style={styles.cardNotice}>
                    <Shield size={13} color={C.primary} />
                    <Text style={styles.cardNoticeTxt}>
                      Card details are stored only on this device and never shared. Payments are processed securely via Stripe.
                    </Text>
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingCard(false)}>
                      <Text style={styles.cancelBtnTxt}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={saveCard} disabled={savingCard}>
                      {savingCard
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <><Save size={15} color="#fff" /><Text style={styles.saveBtnTxt}>Save Card</Text></>}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* No card yet, not editing */}
              {!hasCard && !editingCard && (
                <TouchableOpacity style={styles.emptyState} onPress={() => setEditingCard(true)}>
                  <View style={styles.emptyIcon}>
                    <CreditCard size={22} color={C.textMuted} />
                  </View>
                  <Text style={styles.emptyTxt}>No card saved yet</Text>
                  <Text style={styles.emptySubTxt}>Save a card so your payment details are ready at checkout</Text>
                  <View style={styles.addBtn}>
                    <Text style={styles.addBtnTxt}>Add Card</Text>
                  </View>
                </TouchableOpacity>
              )}
            </SectionCard>

            {/* ── Change Password ───────────────────────────────────────── */}
            <SectionCard
              title="Security"
              subtitle="Change your account password"
              action={() => setEditingPwd((v) => !v)}
              actionLabel={editingPwd ? "Cancel" : "Change password"}
            >
              {!editingPwd ? (
                <View style={styles.securityRow}>
                  <View style={[styles.emptyIcon, { backgroundColor: C.primaryLight }]}>
                    <Lock size={18} color={C.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.securityLabel}>Password</Text>
                    <Text style={styles.securityValue}>••••••••••••</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Field
                    Icon={Lock} label="Current password"
                    value={currentPwd} onChangeText={setCurrentPwd}
                    editable secureTextEntry={!showCurrent}
                    autoCapitalize="none" placeholder="Enter current password"
                    rightIcon={showCurrent
                      ? <EyeOff size={16} color={C.textMuted} />
                      : <Eye    size={16} color={C.textMuted} />}
                    onRightPress={() => setShowCurrent((v) => !v)}
                  />
                  <Field
                    Icon={Lock} label="New password"
                    value={newPwd} onChangeText={setNewPwd}
                    editable secureTextEntry={!showNew}
                    autoCapitalize="none" placeholder="Min. 6 characters"
                    rightIcon={showNew
                      ? <EyeOff size={16} color={C.textMuted} />
                      : <Eye    size={16} color={C.textMuted} />}
                    onRightPress={() => setShowNew((v) => !v)}
                  />
                  <Field
                    Icon={Lock} label="Confirm new password"
                    value={confirmPwd} onChangeText={setConfirmPwd}
                    editable secureTextEntry
                    autoCapitalize="none" placeholder="Repeat new password"
                  />
                  <TouchableOpacity
                    style={[styles.saveBtn, { marginTop: 8 }]}
                    onPress={changePassword}
                    disabled={changingPwd}
                  >
                    {changingPwd
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.saveBtnTxt}>Update Password</Text>}
                  </TouchableOpacity>
                </>
              )}
            </SectionCard>

            {/* ── Logout ────────────────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() =>
                Alert.alert("Log out?", "You will need to sign in again to access your account.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Log Out", style: "destructive", onPress: logout },
                ])
              }
              activeOpacity={0.85}
            >
              <LogOut size={18} color="#EF4444" />
              <Text style={styles.logoutTxt}>Log Out</Text>
            </TouchableOpacity>

            {/* ── Delete Account ────────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.deleteAccountBtn}
              onPress={deleteAccount}
              disabled={deletingAccount}
              activeOpacity={0.85}
            >
              {deletingAccount
                ? <ActivityIndicator size="small" color="#9CA3AF" />
                : <><Trash2 size={16} color="#9CA3AF" /><Text style={styles.deleteAccountTxt}>Delete Account</Text></>}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  backBtn: { display: "none" },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatarGrad: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
  },
  avatarTxt: { fontSize: 30, fontWeight: "900", color: "#fff" },
  avatarBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#0F6B4C",
  },
  headerName:  { fontSize: 22, fontWeight: "900", color: "#fff", marginBottom: 4 },
  headerEmail: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 20 },
  headerStatRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18, paddingVertical: 14, paddingHorizontal: 24,
    width: "100%", justifyContent: "space-between",
  },
  headerStat:        { alignItems: "center", flex: 1 },
  headerStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  headerStatVal:  { fontSize: 16, fontWeight: "800", color: "#fff" },
  headerStatLbl:  { fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 3, fontWeight: "600" },

  // Body
  body: { padding: 20, gap: 16 },

  // Section card
  section: {
    backgroundColor: "#fff",
    borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: "#EEF1F4",
  },
  sectionHead: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: C.textDark },
  sectionSub:   { fontSize: 12, color: C.textMuted, marginTop: 2 },
  sectionAction: {
    backgroundColor: C.primaryLight, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  sectionActionTxt: { fontSize: 12, fontWeight: "700", color: C.primary },
  sectionAccentLine: {
    height: 2, width: 32, backgroundColor: C.primary,
    borderRadius: 1, marginBottom: 16,
  },

  // Field
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8FAFC", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#EEF1F4",
    paddingHorizontal: 14, height: 52,
  },
  fieldRowLocked: { backgroundColor: "#F4F6F8", borderColor: "#F0F4F8" },
  fieldIcon: { marginRight: 10 },
  fieldInput: { flex: 1, fontSize: 14, fontWeight: "600", color: C.textDark },
  fieldInputLocked: { color: C.textMuted },
  fieldRightIcon: { paddingLeft: 8 },

  // Edit action row
  editActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1, height: 46, borderRadius: 999,
    borderWidth: 1.5, borderColor: C.primary,
    alignItems: "center", justifyContent: "center",
  },
  cancelBtnTxt: { fontSize: 13, fontWeight: "700", color: C.primary },
  saveBtn: {
    flex: 1.5, height: 46, borderRadius: 999,
    backgroundColor: C.primary,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  saveBtnTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 16, gap: 6 },
  emptyIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#F4F6F8",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTxt:    { fontSize: 14, fontWeight: "700", color: C.textDark },
  emptySubTxt: { fontSize: 12, color: C.textMuted, textAlign: "center", lineHeight: 18 },
  addBtn: {
    marginTop: 6, backgroundColor: C.primaryLight,
    borderRadius: 999, paddingHorizontal: 22, paddingVertical: 9,
  },
  addBtnTxt: { fontSize: 13, fontWeight: "700", color: C.primary },

  // Saved address display
  savedAddressBox: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.primaryLight, borderRadius: 16, padding: 16,
  },
  savedAddressIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  savedAddressLine:     { fontSize: 14, fontWeight: "700", color: C.textDark },
  savedAddressPostcode: { fontSize: 12, color: C.textMed, marginTop: 2 },
  savedAddressBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#D1FAE5", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  savedAddressBadgeTxt: { fontSize: 11, fontWeight: "700", color: "#059669" },

  // Visual card
  cardVisual: {
    borderRadius: 20, padding: 22, marginBottom: 4,
    minHeight: 180, justifyContent: "space-between",
  },
  cardChip: {
    width: 40, height: 30, borderRadius: 6,
    backgroundColor: "rgba(255,215,0,0.7)", marginBottom: 18,
  },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  cardNumDisplay: { fontSize: 17, fontWeight: "700", color: "#fff", letterSpacing: 2.5 },
  cardBottomRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  cardFieldLabel: { fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5, fontWeight: "600", marginBottom: 4 },
  cardFieldVal:   { fontSize: 13, fontWeight: "700", color: "#fff", letterSpacing: 1 },
  cardBrand: { flexDirection: "row", alignItems: "center" },
  cardBrandCircle: { width: 28, height: 28, borderRadius: 14, opacity: 0.9 },
  removeCardBtn: { alignSelf: "flex-end", marginTop: 14 },
  removeCardTxt: { fontSize: 11, color: "rgba(255,255,255,0.45)", textDecorationLine: "underline" },

  // Card notice
  cardNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: C.primaryLight, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  cardNoticeTxt: { fontSize: 11, color: C.primaryDark, flex: 1, lineHeight: 17 },

  // Security row
  securityRow: { flexDirection: "row", alignItems: "center" },
  securityLabel: { fontSize: 13, color: C.textMed, fontWeight: "500" },
  securityValue: { fontSize: 16, color: C.textDark, fontWeight: "700", marginTop: 2 },

  // Logout
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#FEF2F2", borderRadius: 18, height: 54,
    borderWidth: 1.5, borderColor: "#FECACA",
  },
  logoutTxt: { fontSize: 14, fontWeight: "800", color: "#EF4444" },

  // Delete account
  deleteAccountBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 18, height: 48, borderWidth: 1, borderColor: "#E5E7EB",
  },
  deleteAccountTxt: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
});

export default ProfileScreen;
