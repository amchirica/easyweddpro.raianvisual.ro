"use client";

import { useMemo, useState } from "react";
import { Check, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { EVENT_TYPES } from "@/lib/events/event-types";
import {
  resolvePipelineTemplateForCategories,
} from "@/lib/events/project-pipelines";
import { getDefaultContractTemplateForCategories } from "@/lib/events/contract-templates";
import {
  VENDOR_CATEGORY_GROUPS,
  getVendorTypesByCategory,
  type VendorCategoryGroup,
} from "@/lib/events/vendor-types";
import { formatCurrency } from "@/lib/format";
import { onboardingStep1Schema } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

const TEAM_SIZE_OPTIONS = [
  { value: "Solo", label: "Solo" },
  { value: "2-5", label: "2-5 persoane" },
  { value: "6-15", label: "6-15 persoane" },
  { value: "15+", label: "15+ persoane" },
];

const CURRENCY_OPTIONS = ["RON", "EUR", "USD"];

const STEPS = [
  { id: 1, title: "Business", description: "Ce tip de business administrezi." },
  { id: 2, title: "Servicii", description: "Detalii adaptate tipului tău de activitate." },
  { id: 3, title: "Branding & fiscal", description: "Identitate vizuală și date fiscale." },
  { id: 4, title: "Import date", description: "Importă leaduri și clienți existenți." },
  { id: 5, title: "Primul pas", description: "Creează primul pachet sau serviciu." },
];

type CompanyData = {
  companyName: string;
  city: string;
  country: string;
};

type BrandingData = {
  brandColor: string;
  cui: string;
  address: string;
};

type FirstPackageData = {
  packageName: string;
  packagePrice: string;
};

type SpecialtyFields = {
  deliveryFocus: string;
  lineup: string;
  performanceDuration: string;
  equipment: string;
  capacity: string;
  halls: string;
  menus: string;
  setupTeardown: string;
  inventory: string;
  packageType: string;
  coordinationFee: string;
};

const EMPTY_SPECIALTY: SpecialtyFields = {
  deliveryFocus: "",
  lineup: "",
  performanceDuration: "",
  equipment: "",
  capacity: "",
  halls: "",
  menus: "",
  setupTeardown: "",
  inventory: "",
  packageType: "",
  coordinationFee: "",
};

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const [company, setCompany] = useState<CompanyData>({
    companyName: "",
    city: "",
    country: "România",
  });
  const [businessTypes, setBusinessTypes] = useState<VendorCategoryGroup[]>([]);
  const [vendorCategories, setVendorCategories] = useState<string[]>([]);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [services, setServices] = useState<string[]>([]);
  const [eventsPerYear, setEventsPerYear] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [specialty, setSpecialty] = useState<SpecialtyFields>(EMPTY_SPECIALTY);

  const [branding, setBranding] = useState<BrandingData>({
    brandColor: "#c6a76a",
    cui: "",
    address: "",
  });
  const [currency, setCurrency] = useState("RON");

  const [importSkipped, setImportSkipped] = useState(false);

  const [firstPackage, setFirstPackage] = useState<FirstPackageData>({
    packageName: "",
    packagePrice: "",
  });

  const progress = useMemo(() => (step / STEPS.length) * 100, [step]);

  const activityLabel = useMemo(() => {
    if (!businessTypes.length) return "";
    return VENDOR_CATEGORY_GROUPS.filter((group) => businessTypes.includes(group.code))
      .map((group) => group.label)
      .join(", ");
  }, [businessTypes]);

  const serviceSuggestions = useMemo(() => {
    const fromVendors = vendorCategories
      .map((code) => getVendorTypesByCategory(businessTypes[0] ?? "other").find((v) => v.code === code)?.label)
      .filter(Boolean) as string[];
    const fromCategories = businessTypes.flatMap((group) =>
      getVendorTypesByCategory(group).slice(0, 4).map((item) => item.label),
    );
    return [...new Set([...fromVendors, ...fromCategories, ...EVENT_TYPES.slice(0, 4).map((e) => e.label)])];
  }, [businessTypes, vendorCategories]);

  const showPhotoFields = businessTypes.includes("photo_video");
  const showMusicFields = businessTypes.includes("music_entertainment");
  const showVenueFields = businessTypes.includes("venue");
  const showDecorFields = businessTypes.includes("decor_flowers");
  const showPlannerFields = businessTypes.includes("planning");

  function toggleBusinessType(code: VendorCategoryGroup) {
    setBusinessTypes((prev) => {
      const next = prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code];
      const allowed = new Set(
        next.flatMap((group) => getVendorTypesByCategory(group).map((item) => item.code)),
      );
      setVendorCategories((current) => current.filter((item) => allowed.has(item)));
      return next;
    });
  }

  function toggleVendorCategory(code: string) {
    setVendorCategories((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  }

  function toggleService(service: string) {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((item) => item !== service) : [...prev, service],
    );
  }

  function goNext() {
    if (step === 1) {
      const result = onboardingStep1Schema.safeParse({
        companyName: company.companyName,
        activityType: activityLabel,
        city: company.city,
        country: company.country,
      });
      if (!result.success || businessTypes.length === 0) {
        setCompanyError(
          businessTypes.length === 0
            ? "Selectează cel puțin un tip de business."
            : (result.error?.issues[0]?.message ?? "Completează toate câmpurile."),
        );
        return;
      }
      setCompanyError(null);
    }
    setStep((current) => Math.min(current + 1, STEPS.length));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    setFinishError(null);

    const specialtyNotes = Object.entries(specialty)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => `${key}: ${value.trim()}`);

    try {
      const result = await completeOnboardingAction({
        companyName: company.companyName,
        activityType: activityLabel,
        city: company.city,
        country: company.country,
        services: [...services, ...specialtyNotes],
        eventsPerYear: eventsPerYear.trim() === "" ? null : Number(eventsPerYear),
        teamSize,
        currency,
        timezone: "Europe/Bucharest",
        brandAccent: branding.brandColor,
        cui: branding.cui,
        fiscalAddress: branding.address,
        importSkipped,
        packageName: firstPackage.packageName,
        packagePrice:
          firstPackage.packagePrice.trim() === "" ? null : Number(firstPackage.packagePrice),
        businessTypes,
        vendorCategories,
        defaultProjectPipeline: resolvePipelineTemplateForCategories(businessTypes),
        defaultContractTemplate: getDefaultContractTemplateForCategories(businessTypes),
      });

      if (result?.error) {
        setFinishError(result.error);
        setFinishing(false);
      }
    } catch (error) {
      if (isRedirectError(error)) throw error;
      setFinishError("Nu am putut finaliza onboarding-ul. Încearcă din nou.");
      setFinishing(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Pasul {step} din {STEPS.length}
          </span>
          <span>{STEPS[step - 1]?.title}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full bg-champagne transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 flex items-center gap-2">
          {STEPS.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                item.id < step
                  ? "border-champagne bg-champagne text-primary-foreground"
                  : item.id === step
                    ? "border-champagne text-champagne"
                    : "border-border text-muted-soft",
              )}
            >
              {item.id < step ? <Check className="h-3.5 w-3.5" aria-hidden /> : item.id}
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-medium text-foreground">
          {STEPS[step - 1]?.title}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{STEPS[step - 1]?.description}</p>

        <div className="mt-8">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="companyName">Numele businessului</Label>
                <Input
                  id="companyName"
                  placeholder="Nova Events"
                  value={company.companyName}
                  onChange={(event) =>
                    setCompany((prev) => ({ ...prev, companyName: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Ce tip de business administrezi?</Label>
                <p className="text-xs text-muted-soft">Poți selecta mai multe categorii.</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {VENDOR_CATEGORY_GROUPS.map((group) => {
                    const active = businessTypes.includes(group.code);
                    return (
                      <button
                        key={group.code}
                        type="button"
                        onClick={() => toggleBusinessType(group.code)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                          active
                            ? "border-champagne/40 bg-champagne/10 text-champagne-soft"
                            : "border-border text-muted-foreground hover:border-champagne/25",
                        )}
                      >
                        <span>
                          <span className="block font-medium">{group.label}</span>
                          <span className="mt-0.5 block text-xs opacity-80">{group.description}</span>
                        </span>
                        {active ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {businessTypes.length > 0 ? (
                <div className="space-y-2">
                  <Label>Categorii de furnizor (opțional)</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {businessTypes.flatMap((group) =>
                      getVendorTypesByCategory(group).map((vendor) => {
                        const active = vendorCategories.includes(vendor.code);
                        return (
                          <button
                            key={vendor.code}
                            type="button"
                            onClick={() => toggleVendorCategory(vendor.code)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                              active
                                ? "border-champagne/40 bg-champagne/10 text-champagne-soft"
                                : "border-border text-muted-foreground hover:border-champagne/25",
                            )}
                          >
                            {vendor.label}
                          </button>
                        );
                      }),
                    )}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Oraș</Label>
                  <Input
                    id="city"
                    placeholder="București"
                    value={company.city}
                    onChange={(event) =>
                      setCompany((prev) => ({ ...prev, city: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Țară</Label>
                  <Input
                    id="country"
                    placeholder="România"
                    value={company.country}
                    onChange={(event) =>
                      setCompany((prev) => ({ ...prev, country: event.target.value }))
                    }
                  />
                </div>
              </div>

              {companyError ? (
                <p
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {companyError}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Alege serviciile pe care le oferi — le poți edita oricând din setări.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {serviceSuggestions.map((service) => {
                  const active = services.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                        active
                          ? "border-champagne/40 bg-champagne/10 text-champagne-soft"
                          : "border-border text-muted-foreground hover:border-champagne/25",
                      )}
                    >
                      {service}
                      {active ? <Check className="h-4 w-4" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eventsPerYear">Evenimente pe an (aprox.)</Label>
                  <Input
                    id="eventsPerYear"
                    type="number"
                    min={0}
                    placeholder="30"
                    value={eventsPerYear}
                    onChange={(event) => setEventsPerYear(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Mărimea echipei</Label>
                  <Select value={teamSize} onValueChange={(value) => setTeamSize(value ?? "")}>
                    <SelectTrigger id="teamSize" className="h-8 w-full">
                      <SelectValue placeholder="Selectează" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showPhotoFields ? (
                <div className="space-y-2">
                  <Label htmlFor="deliveryFocus">Focus livrare (foto-video)</Label>
                  <Input
                    id="deliveryFocus"
                    placeholder="Ex: galerie online, film highlight, album"
                    value={specialty.deliveryFocus}
                    onChange={(event) =>
                      setSpecialty((prev) => ({ ...prev, deliveryFocus: event.target.value }))
                    }
                  />
                </div>
              ) : null}

              {showMusicFields ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lineup">Componență / formație</Label>
                    <Input
                      id="lineup"
                      placeholder="DJ solo, 4 instrumente…"
                      value={specialty.lineup}
                      onChange={(event) =>
                        setSpecialty((prev) => ({ ...prev, lineup: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="performanceDuration">Durată prestație</Label>
                    <Input
                      id="performanceDuration"
                      placeholder="4–6 ore"
                      value={specialty.performanceDuration}
                      onChange={(event) =>
                        setSpecialty((prev) => ({
                          ...prev,
                          performanceDuration: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="equipment">Echipamente</Label>
                    <Input
                      id="equipment"
                      placeholder="Sonorizare proprie, lumini…"
                      value={specialty.equipment}
                      onChange={(event) =>
                        setSpecialty((prev) => ({ ...prev, equipment: event.target.value }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              {showVenueFields ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacitate</Label>
                    <Input
                      id="capacity"
                      placeholder="180 persoane"
                      value={specialty.capacity}
                      onChange={(event) =>
                        setSpecialty((prev) => ({ ...prev, capacity: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="halls">Săli</Label>
                    <Input
                      id="halls"
                      placeholder="2 săli + terasă"
                      value={specialty.halls}
                      onChange={(event) =>
                        setSpecialty((prev) => ({ ...prev, halls: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="menus">Meniuri / servicii incluse</Label>
                    <Input
                      id="menus"
                      placeholder="Meniu standard, open bar…"
                      value={specialty.menus}
                      onChange={(event) =>
                        setSpecialty((prev) => ({ ...prev, menus: event.target.value }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              {showDecorFields ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="setupTeardown">Montaj / demontaj</Label>
                    <Input
                      id="setupTeardown"
                      placeholder="Montaj cu o zi înainte"
                      value={specialty.setupTeardown}
                      onChange={(event) =>
                        setSpecialty((prev) => ({ ...prev, setupTeardown: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inventory">Inventar / materiale</Label>
                    <Input
                      id="inventory"
                      placeholder="Stâlpi, textile, flori…"
                      value={specialty.inventory}
                      onChange={(event) =>
                        setSpecialty((prev) => ({ ...prev, inventory: event.target.value }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              {showPlannerFields ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="packageType">Tip pachet</Label>
                    <Input
                      id="packageType"
                      placeholder="Full planning / day-of coordination"
                      value={specialty.packageType}
                      onChange={(event) =>
                        setSpecialty((prev) => ({ ...prev, packageType: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coordinationFee">Fee (fix / procentual)</Label>
                    <Input
                      id="coordinationFee"
                      placeholder="Fee fix sau % din buget"
                      value={specialty.coordinationFee}
                      onChange={(event) =>
                        setSpecialty((prev) => ({ ...prev, coordinationFee: event.target.value }))
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="currency">Monedă</Label>
                <Select value={currency} onValueChange={(value) => setCurrency(value ?? "RON")}>
                  <SelectTrigger id="currency" className="h-8 w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandColor">Culoare de brand</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="brandColor"
                    type="color"
                    value={branding.brandColor}
                    onChange={(event) =>
                      setBranding((prev) => ({ ...prev, brandColor: event.target.value }))
                    }
                    className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-transparent"
                  />
                  <span className="text-sm text-muted-foreground">{branding.brandColor}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cui">CUI / CIF</Label>
                <Input
                  id="cui"
                  placeholder="RO12345678"
                  value={branding.cui}
                  onChange={(event) =>
                    setBranding((prev) => ({ ...prev, cui: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresă sediu</Label>
                <Input
                  id="address"
                  placeholder="Str. Exemplu nr. 1, București"
                  value={branding.address}
                  onChange={(event) =>
                    setBranding((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center transition-colors",
                  importSkipped && "opacity-50",
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-champagne/30 bg-champagne/10 text-champagne">
                  <Upload className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-sm text-foreground">Importă leaduri și clienți din CSV</p>
                <p className="max-w-sm text-xs text-muted-soft">
                  Poți importa oricând mai târziu din Setări → Import date.
                </p>
                <Button variant="outline" size="sm" type="button" disabled>
                  Alege fișier CSV
                </Button>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={importSkipped}
                  onChange={(event) => setImportSkipped(event.target.checked)}
                  className="size-4 accent-[var(--champagne)]"
                />
                Sar peste acest pas — voi importa datele mai târziu
              </label>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Creează primul pachet sau serviciu — îl poți folosi imediat într-o ofertă.
              </p>
              <div className="space-y-2">
                <Label htmlFor="packageName">Nume pachet / serviciu</Label>
                <Input
                  id="packageName"
                  placeholder="Pachet Full Service"
                  value={firstPackage.packageName}
                  onChange={(event) =>
                    setFirstPackage((prev) => ({ ...prev, packageName: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packagePrice">Preț (RON)</Label>
                <Input
                  id="packagePrice"
                  type="number"
                  min={0}
                  placeholder="12000"
                  value={firstPackage.packagePrice}
                  onChange={(event) =>
                    setFirstPackage((prev) => ({ ...prev, packagePrice: event.target.value }))
                  }
                />
                {firstPackage.packagePrice ? (
                  <p className="text-xs text-muted-soft">
                    {formatCurrency(Number(firstPackage.packagePrice) || 0)}
                  </p>
                ) : null}
              </div>
              <p className="text-xs text-muted-soft">
                Poți sări și acest pas — pachetul se poate crea oricând din Dashboard → Template-uri.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {finishError ? (
        <p
          className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {finishError}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} disabled={step === 1 || finishing}>
          Înapoi
        </Button>
        {step < STEPS.length ? (
          <Button onClick={goNext}>Continuă</Button>
        ) : (
          <Button onClick={handleFinish} disabled={finishing}>
            {finishing ? "Se finalizează…" : "Finalizează"}
          </Button>
        )}
      </div>
    </div>
  );
}
