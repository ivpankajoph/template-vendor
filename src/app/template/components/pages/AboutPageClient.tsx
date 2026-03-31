"use client";

import { JSX } from "react";
import { useSelector } from "react-redux";

import { Leaf, Users, Award, Heart } from "lucide-react";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import {
  configuredArray,
  configuredText,
  hasMeaningfulText,
} from "@/app/template/components/template-content";

// map icon names from API to actual icons
const iconMap: Record<string, JSX.Element> = {
  leaf: <Leaf size={40} />,
  users: <Users size={40} />,
  award: <Award size={40} />,
  heart: <Heart size={40} />,
};

type VendorStory = {
  key: string;
  title: string;
  narrative: string;
  tag?: string;
};

function VendorStoriesSection({
  stories,
  heading,
  subtitle,
  theme,
}: {
  stories: VendorStory[];
  heading: string;
  subtitle: string;
  theme:
    | "studio"
    | "minimal"
    | "classic"
    | "trend"
    | "mquiq"
    | "poupqz"
    | "oragze"
    | "whiterose";
}) {
  if (stories.length === 0) return null;

  const isStudio = theme === "studio";
  const isMinimal =
    theme === "minimal" ||
    theme === "mquiq" ||
    theme === "poupqz" ||
    theme === "whiterose";
  const isTrend = theme === "trend" || theme === "oragze";
  const sectionClass = isStudio
    ? "mx-auto max-w-7xl px-6 pb-16"
    : isMinimal
      ? "mx-auto max-w-6xl px-6 pb-16"
      : isTrend
        ? "mx-auto max-w-7xl px-6 pb-16"
      : "mt-20";
  const wrapperClass = isStudio
    ? "rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
    : isMinimal
      ? "rounded-3xl border border-slate-200 bg-white p-6"
      : isTrend
        ? "rounded-3xl border border-rose-200 bg-white p-6"
      : "rounded-2xl border border-slate-200 bg-white p-8";
  const cardClass = isStudio
    ? "rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
    : isMinimal
      ? "rounded-2xl border border-slate-200 bg-slate-50 p-5"
      : isTrend
        ? "rounded-2xl border border-rose-200 bg-rose-50/60 p-5"
      : "rounded-xl border border-slate-200 bg-slate-50 p-5";
  const titleTone = isStudio ? "text-slate-100" : isTrend ? "text-slate-900" : "text-slate-900";
  const subtitleTone = isStudio ? "text-slate-400" : isTrend ? "text-slate-600" : "text-slate-500";
  const bodyTone = isStudio ? "text-slate-300" : isTrend ? "text-slate-700" : "text-slate-700";
  const tagClass = isStudio
    ? "inline-flex rounded-full bg-slate-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
    : isTrend
      ? "inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-600 border border-rose-200"
    : "inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 border border-slate-200";

  return (
    <section className={sectionClass} data-template-section="vendorStories">
      <div className={wrapperClass}>
        <h2
          className={`text-3xl font-semibold ${titleTone}`}
          data-template-path="components.about_page.vendorStories.heading"
          data-template-section="vendorStories"
        >
          {heading}
        </h2>
        <p
          className={`mt-2 text-sm ${subtitleTone}`}
          data-template-path="components.about_page.vendorStories.subtitle"
          data-template-section="vendorStories"
        >
          {subtitle}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stories.map((story, index) => (
            <article key={`${story.key}-${index}`} className={cardClass}>
              {story.tag ? (
                <span
                  className={tagClass}
                  data-template-path={`components.about_page.vendorStories.items.${index}.tag`}
                  data-template-section="vendorStories"
                >
                  {story.tag}
                </span>
              ) : null}
              <h3
                className={`mt-3 text-lg font-semibold ${titleTone}`}
                data-template-path={`components.about_page.vendorStories.items.${index}.title`}
                data-template-section="vendorStories"
              >
                {story.title}
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${bodyTone}`}
                data-template-path={`components.about_page.vendorStories.items.${index}.narrative`}
                data-template-section="vendorStories"
              >
                {story.narrative}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const variant = useTemplateVariant();
  const { aboutpage, vendor, vendorOverrides, loading } = useSelector(
    (state: any) => ({
      aboutpage: state.alltemplatepage?.data?.components?.about_page,
      vendor: state?.vendorprofilepage?.vendor,
      vendorOverrides: state.alltemplatepage?.data?.components?.vendor_profile,
      loading: state.alltemplatepage?.loading,
    })
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-xl">
        Loading...
      </div>
    );
  }

  const pickText = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };
  const toMappedIconKey = (
    iconCandidate: unknown,
    fallback: keyof typeof iconMap
  ): keyof typeof iconMap => {
    const iconKey =
      typeof iconCandidate === "string" ? iconCandidate.trim().toLowerCase() : "";
    return iconKey && iconKey in iconMap
      ? (iconKey as keyof typeof iconMap)
      : fallback;
  };
  const vendorBaseRecord =
    vendor && typeof vendor === "object"
      ? (vendor as Record<string, unknown>)
      : {};
  const vendorOverrideRecord =
    vendorOverrides && typeof vendorOverrides === "object"
      ? (vendorOverrides as Record<string, unknown>)
      : {};
  const vendorRecord = {
    ...vendorBaseRecord,
    ...vendorOverrideRecord,
  };
  const getVendorMatch = (...keys: string[]) => {
    for (const key of keys) {
      const value = vendorRecord[key];
      if (value === null || value === undefined) continue;
      if (typeof value === "string" && !value.trim()) continue;
      return { key, value };
    }
    return null;
  };
  const getVendorRaw = (...keys: string[]) => {
    return getVendorMatch(...keys)?.value;
  };
  const formatUnknown = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return `${value}`;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      return value
        .map((item) => formatUnknown(item))
        .filter((item) => item.length > 0)
        .join(", ");
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return "";
  };
  const getVendorText = (...keys: string[]) => formatUnknown(getVendorRaw(...keys));

  const vendorName = pickText(
    getVendorText("name", "registrar_name", "business_name"),
    "Our Store"
  );
  const vendorLocation = [
    getVendorText("city"),
    getVendorText("state"),
    getVendorText("country"),
  ]
    .filter((item) => item.length > 0)
    .join(", ");
  const vendorBusinessType = pickText(
    getVendorText("business_type", "business_nature"),
    "Retail"
  );
  const vendorSince = getVendorText("createdAt")
    ? new Date(getVendorText("createdAt")).getFullYear()
    : new Date().getFullYear();
  const establishedYear = pickText(getVendorText("established_year"), `${vendorSince}`);
  const vendorCategories = pickText(getVendorText("categories"), "General merchandise");
  const vendorDealingArea = getVendorText("dealing_area");
  const vendorOfficeEmployees = getVendorText("office_employees");
  const vendorOperatingHours = getVendorText("operating_hours");
  const vendorReturnPolicy = getVendorText("return_policy");
  const vendorTurnover = getVendorText("annual_turnover");

  const vendorStoriesFallback: VendorStory[] = [
    {
      key: "origin",
      title: "How It Started",
      tag: `Since ${establishedYear}`,
      narrative: `${vendorName} began in ${establishedYear} as a ${vendorBusinessType.toLowerCase()} business${vendorLocation ? ` in ${vendorLocation}` : ""}.`,
    },
    {
      key: "focus",
      title: "What We Focus On",
      tag: "Catalog",
      narrative: `Current focus areas include ${vendorCategories}${vendorDealingArea ? `, serving ${vendorDealingArea}` : ""}.`,
    },
    {
      key: "service",
      title: "How We Serve",
      tag: "Service",
      narrative: `${vendorOperatingHours ? `Support is available during ${vendorOperatingHours}` : "Support is available through direct contact channels"}${vendorReturnPolicy ? ` with a ${vendorReturnPolicy.toLowerCase()} return policy` : ""}.`,
    },
    {
      key: "scale",
      title: "Team & Growth",
      tag: "Scale",
      narrative: `${vendorOfficeEmployees ? `${vendorOfficeEmployees} team members` : "A dedicated team"} run daily operations${vendorTurnover ? `, with annual turnover in the range of ${vendorTurnover}` : ""}.`,
    },
  ];
  const hasVendorStoriesConfig = Array.isArray(aboutpage?.vendorStories?.items);
  const vendorStoriesHeading = configuredText(
    aboutpage?.vendorStories?.heading,
    "Vendor Stories"
  );
  const vendorStoriesSubtitle = configuredText(
    aboutpage?.vendorStories?.subtitle,
    "Short highlights that tell this vendor's journey."
  );
  const vendorStoriesFromTemplate = configuredArray<any>(
    aboutpage?.vendorStories?.items,
    []
  );
  const vendorStories: VendorStory[] = hasVendorStoriesConfig
    ? vendorStoriesFromTemplate
        .map((source: any, index: number) => ({
          key: `story-${index + 1}`,
          tag: configuredText(source?.tag),
          title: configuredText(source?.title),
          narrative: configuredText(source?.narrative),
        }))
        .filter(
          (story) =>
            hasMeaningfulText(story.tag) ||
            hasMeaningfulText(story.title) ||
            hasMeaningfulText(story.narrative)
        )
    : vendorStoriesFallback;

  const hero = {
    kicker: configuredText(aboutpage?.hero?.kicker, "Built for Industry"),
    title: configuredText(aboutpage?.hero?.title, `About ${vendorName}`),
    subtitle: configuredText(
      aboutpage?.hero?.subtitle,
      `${vendorBusinessType} business${vendorLocation ? ` in ${vendorLocation}` : ""}.`
    ),
    backgroundImage: configuredText(
      aboutpage?.hero?.backgroundImage,
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1600&q=80"
    ),
  };

  const hasStoryParagraphConfig = Array.isArray(aboutpage?.story?.paragraphs);
  const storyParagraphsFromTemplate = configuredArray<unknown>(
    aboutpage?.story?.paragraphs,
    []
  )
    .map((line) => configuredText(line))
    .filter((line) => line !== "");

  const story = {
    heading: configuredText(aboutpage?.story?.heading, "Our Story"),
    paragraphs: hasStoryParagraphConfig
      ? storyParagraphsFromTemplate
      : [
            `${vendorName} was founded in ${vendorSince} with a focus on dependable products and transparent service.`,
            `${vendorBusinessType} expertise and customer-first support help us deliver a better shopping experience every day.`,
            vendorLocation
              ? `We currently serve customers from ${vendorLocation} and beyond.`
              : "We continue to improve our catalog and support quality for every customer.",
          ],
    image: configuredText(
      aboutpage?.story?.image,
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80"
    ),
  };

  const hasValuesConfig = Array.isArray(aboutpage?.values);
  const valuesFromTemplate = configuredArray<any>(aboutpage?.values, []);
  const values = hasValuesConfig
    ? valuesFromTemplate.filter((item: any) =>
        Boolean(
          hasMeaningfulText(item?.title) ||
            hasMeaningfulText(item?.description) ||
            hasMeaningfulText(item?.icon)
        )
      )
    : [
          {
            icon: "award",
            title: "Quality First",
            description: `Every product at ${vendorName} is selected for reliability and value.`,
          },
          {
            icon: "heart",
            title: "Customer Care",
            description: `Fast support through ${pickText(getVendorText("email"), "our support channels")} and ${pickText(getVendorText("phone", "alternate_contact_phone"), "phone assistance")}.`,
          },
          {
            icon: "users",
            title: "Trusted Service",
            description: `Consistent service standards since ${vendorSince}.`,
          },
          {
            icon: "leaf",
            title: "Continuous Improvement",
            description: `We keep refining our catalog and operations to serve customers better.`,
          },
        ];
  const mquiqValueFallbacks: Array<{
    icon: keyof typeof iconMap;
    title: string;
    description: string;
  }> = [
    {
      icon: "award",
      title: "Integrity",
      description: "We maintain honesty in all our dealings.",
    },
    {
      icon: "heart",
      title: "Innovation",
      description: "We constantly evolve to meet customer needs.",
    },
    {
      icon: "users",
      title: "Customer Focus",
      description: "We prioritize practical solutions for every client.",
    },
  ];
  const mquiqValues = Array.from({ length: 3 }, (_, index) => {
    const fallback = mquiqValueFallbacks[index];
    const sourceValue = valuesFromTemplate[index] || values[index] || fallback;
    return {
      icon: toMappedIconKey((sourceValue as any)?.icon, fallback.icon),
      title: configuredText((sourceValue as any)?.title, fallback.title),
      description: configuredText((sourceValue as any)?.description, fallback.description),
    };
  });

  const hasTeamConfig = Array.isArray(aboutpage?.team);
  const teamFromTemplate = configuredArray<any>(aboutpage?.team, []);
  const team = hasTeamConfig
    ? teamFromTemplate.filter((item: any) =>
        Boolean(
          hasMeaningfulText(item?.name) ||
            hasMeaningfulText(item?.role) ||
            hasMeaningfulText(item?.image)
        )
      )
    : [
          {
            name: vendorName,
            role: pickText(vendorBusinessType, "Store Owner"),
            image:
              "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
          },
        ];

  const hasStatsConfig = Array.isArray(aboutpage?.stats);
  const statsFromTemplate = configuredArray<any>(aboutpage?.stats, []);
  const stats = hasStatsConfig
    ? statsFromTemplate.filter((item: any) =>
        Boolean(
          hasMeaningfulText(item?.label) ||
            hasMeaningfulText(configuredText(item?.value))
        )
      )
    : [
          { value: `${vendorSince}`, label: "Serving Since" },
          {
            value: pickText(getVendorText("operating_hours"), "Mon - Sat"),
            label: "Operating Hours",
          },
          {
            value: pickText(getVendorText("return_policy"), "Easy"),
            label: "Return Policy",
          },
        ];

  if (variant.key === "studio") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Our Studio
              </p>
              <h1 className="mt-4 text-5xl font-semibold">{hero?.title}</h1>
              <p className="mt-4 text-lg text-slate-300">{hero?.subtitle}</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
              {hero?.backgroundImage ? (
                <img
                  src={hero.backgroundImage}
                  alt="Studio hero"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-xs uppercase tracking-[0.4em] text-slate-500">
                  Hero Image
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
              <h2 className="text-3xl font-semibold">{story?.heading}</h2>
              <div className="mt-4 space-y-4 text-slate-300">
                {story?.paragraphs?.map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
              {story?.image ? (
                <img
                  src={story.image}
                  alt="Story"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[260px] items-center justify-center text-xs uppercase tracking-[0.4em] text-slate-500">
                  Story Image
                </div>
              )}
            </div>
          </div>
        </section>

        {values?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-16">
            <h2 className="text-3xl font-semibold">Values & Culture</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                >
                  <div className="mb-4 text-slate-200">
                    {iconMap[value.icon] || <Leaf size={32} />}
                  </div>
                  <h3 className="text-lg font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {team?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-16">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-semibold">The Team</h2>
                <p className="mt-2 text-sm text-slate-400">
                  The people behind the storefront.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {team.map((member: any, index: number) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-center"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="mx-auto h-36 w-36 rounded-2xl object-cover"
                  />
                  <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {stats?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-16">
            <div className="grid gap-6 md:grid-cols-3">
              {stats.map((item: any, i: number) => (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
                >
                  <p className="text-4xl font-semibold">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <VendorStoriesSection
          stories={vendorStories}
          heading={vendorStoriesHeading}
          subtitle={vendorStoriesSubtitle}
          theme="studio"
        />

              </div>
    );
  }

  if (variant.key === "mquiq") {
    return (
      <div className="min-h-screen bg-[#f3f3f3] text-[#2f3136]">
        <section className="mx-auto max-w-7xl px-6 py-14" data-template-section="hero">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p
                className="inline-flex rounded-full bg-[#e8eef7] px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#f4b400]"
                data-template-path="components.about_page.hero.kicker"
                data-template-section="hero"
              >
                {hero?.kicker}
              </p>
              <h1
                className="mt-4 text-5xl font-bold leading-tight text-[#2f3136]"
                data-template-path="components.about_page.hero.title"
                data-template-section="hero"
              >
                {hero?.title}
              </h1>
              <p
                className="mt-4 max-w-2xl text-lg text-[#566173]"
                data-template-path="components.about_page.hero.subtitle"
                data-template-section="hero"
              >
                {hero?.subtitle}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {stats?.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="rounded-xl border border-[#d7dde7] bg-white p-4">
                    <p className="text-2xl font-bold text-[#2f3136]">{item.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#6b7280]">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#d7dde7] bg-white p-2 shadow-sm">
              {hero?.backgroundImage ? (
                <img
                  src={hero.backgroundImage}
                  alt="Mquiq hero"
                  className="h-full w-full rounded-xl object-cover"
                  data-template-path="components.about_page.hero.backgroundImage"
                  data-template-section="hero"
                  data-template-component="components.about_page.hero.backgroundImage"
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                  Hero image
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12" data-template-section="story">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-2xl border border-[#d7dde7] bg-white">
              {story?.image ? (
                <img
                  src={story.image}
                  alt="Story"
                  className="h-full w-full object-cover"
                  data-template-path="components.about_page.story.image"
                  data-template-section="story"
                  data-template-component="components.about_page.story.image"
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                  Story image
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-[#d7dde7] bg-white p-8">
              <h2
                className="text-3xl font-bold text-[#2f3136]"
                data-template-path="components.about_page.story.heading"
                data-template-section="story"
              >
                {story?.heading}
              </h2>
              <div className="mt-4 space-y-4 text-[#566173]">
                {story?.paragraphs?.map((paragraph: string, index: number) => (
                  <p
                    key={index}
                    data-template-path={`components.about_page.story.paragraphs.${index}`}
                    data-template-section="story"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12" data-template-section="values">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {mquiqValues.map((value, index: number) => (
              <div
                key={`${value.title}-${index}`}
                className="flex h-full flex-col rounded-2xl border border-[#d7dde7] bg-white p-6"
              >
                <div className="mb-4 text-[#f4b400]">{iconMap[value.icon] || <Leaf size={30} />}</div>
                <h3
                  className="min-h-[2.2rem] text-lg font-semibold text-[#2f3136]"
                  data-template-path={`components.about_page.values.${index}.title`}
                  data-template-section="values"
                >
                  {value.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed text-[#5f6b7c]"
                  data-template-path={`components.about_page.values.${index}.description`}
                  data-template-section="values"
                >
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <VendorStoriesSection
          stories={vendorStories}
          heading={vendorStoriesHeading}
          subtitle={vendorStoriesSubtitle}
          theme="mquiq"
        />

              </div>
    );
  }

  if (variant.key === "poupqz") {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-[#1f2937]">
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="rounded-3xl border border-[#dce2eb] bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b74c6]">Warehouse Experts</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <h1 className="text-5xl font-bold leading-tight text-[#111827]">{hero?.title}</h1>
                <p className="mt-4 text-lg text-[#4b5563]">{hero?.subtitle}</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#dce2eb]">
                {hero?.backgroundImage ? (
                  <img src={hero.backgroundImage} alt="Poupqz hero" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-72 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                    Hero image
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-[#dce2eb] bg-white p-7">
              <h2 className="text-3xl font-semibold text-[#111827]">{story?.heading}</h2>
              <div className="mt-4 space-y-4 text-[#4b5563]">
                {story?.paragraphs?.map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#dce2eb] bg-white">
              {story?.image ? (
                <img src={story.image} alt="Story" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                  Story image
                </div>
              )}
            </div>
          </div>
        </section>

        {values?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-12">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value: any, index: number) => (
                <div key={index} className="rounded-2xl border border-[#dce2eb] bg-white p-5">
                  <div className="mb-3 text-[#0b74c6]">{iconMap[value.icon] || <Leaf size={28} />}</div>
                  <h3 className="text-lg font-semibold text-[#111827]">{value.title}</h3>
                  <p className="mt-2 text-sm text-[#4b5563]">{value.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {team?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-12">
            <h2 className="text-2xl font-semibold text-[#111827]">Operational Team</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {team.map((member: any, index: number) => (
                <div key={index} className="rounded-2xl border border-[#dce2eb] bg-white p-5 text-center">
                  <img src={member.image} alt={member.name} className="mx-auto h-28 w-28 rounded-full object-cover" />
                  <h3 className="mt-3 text-lg font-semibold text-[#111827]">{member.name}</h3>
                  <p className="text-sm text-[#0b74c6]">{member.role}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <VendorStoriesSection
          stories={vendorStories}
          heading={vendorStoriesHeading}
          subtitle={vendorStoriesSubtitle}
          theme="poupqz"
        />

              </div>
    );
  }

  if (variant.key === "oragze") {
    return (
      <div className="min-h-screen bg-[#f1f2ef] text-[#1f2a1f]">
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-[#e8f3db] px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#5b8f2f]">
                Organic Story
              </p>
              <h1 className="mt-4 text-5xl font-bold leading-tight text-[#203520]">{hero?.title}</h1>
              <p className="mt-4 text-lg text-[#4f5f48]">{hero?.subtitle}</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-[#d8dccf] bg-white p-2">
              {hero?.backgroundImage ? (
                <img src={hero.backgroundImage} alt="Oragze hero" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                  Hero image
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="rounded-3xl border border-[#d8dccf] bg-white p-8">
            <h2 className="text-3xl font-semibold text-[#203520]">{story?.heading}</h2>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="space-y-4 text-[#4f5f48]">
                {story?.paragraphs?.map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#d8dccf]">
                {story?.image ? (
                  <img src={story.image} alt="Story" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-64 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                    Story image
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {values?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-12">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value: any, index: number) => (
                <div key={index} className="rounded-2xl border border-[#d8dccf] bg-white p-5">
                  <div className="mb-3 text-[#6dbf4b]">{iconMap[value.icon] || <Leaf size={30} />}</div>
                  <h3 className="text-lg font-semibold text-[#203520]">{value.title}</h3>
                  <p className="mt-2 text-sm text-[#4f5f48]">{value.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {stats?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-12">
            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((item: any, index: number) => (
                <div key={index} className="rounded-2xl border border-[#d8dccf] bg-[#f8fbf4] p-6">
                  <p className="text-3xl font-bold text-[#203520]">{item.value}</p>
                  <p className="mt-2 text-sm text-[#4f5f48]">{item.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <VendorStoriesSection
          stories={vendorStories}
          heading={vendorStoriesHeading}
          subtitle={vendorStoriesSubtitle}
          theme="oragze"
        />

              </div>
    );
  }

  if (variant.key === "whiterose") {
    return (
      <div className="min-h-screen bg-[#f6f6f6] text-[#2b2f36]">
        <section className="mx-auto max-w-[1500px] px-6 py-12">
          <div className="rounded-2xl border border-[#dce2eb] bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b74c6]">Premium Furniture Story</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <h1 className="text-5xl font-semibold leading-tight text-[#1f2937]">{hero?.title}</h1>
                <p className="mt-4 text-lg text-[#4b5563]">{hero?.subtitle}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {stats?.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="rounded-xl border border-[#dce2eb] bg-[#f8fafc] p-4">
                      <p className="text-2xl font-semibold text-[#1f2937]">{item.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#6b7280]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#dce2eb]">
                {hero?.backgroundImage ? (
                  <img src={hero.backgroundImage} alt="White Rose hero" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-72 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                    Hero image
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1500px] px-6 pb-12">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="overflow-hidden rounded-xl border border-[#dce2eb] bg-white">
              {story?.image ? (
                <img src={story.image} alt="Story" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                  Story image
                </div>
              )}
            </div>
            <div className="rounded-xl border border-[#dce2eb] bg-white p-8">
              <h2 className="text-3xl font-semibold text-[#1f2937]">{story?.heading}</h2>
              <div className="mt-4 space-y-4 text-[#4b5563]">
                {story?.paragraphs?.map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {values?.length > 0 && (
          <section className="mx-auto max-w-[1500px] px-6 pb-12">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value: any, index: number) => (
                <div key={index} className="rounded-xl border border-[#dce2eb] bg-white p-5">
                  <div className="mb-3 text-[#0b74c6]">{iconMap[value.icon] || <Leaf size={28} />}</div>
                  <h3 className="text-lg font-semibold text-[#1f2937]">{value.title}</h3>
                  <p className="mt-2 text-sm text-[#4b5563]">{value.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <VendorStoriesSection
          stories={vendorStories}
          heading={vendorStoriesHeading}
          subtitle={vendorStoriesSubtitle}
          theme="whiterose"
        />

              </div>
    );
  }

  if (variant.key === "trend") {
    return (
      <div className="min-h-screen bg-rose-50/40 text-slate-900">
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">
                About this store
              </span>
              <h1 className="mt-4 text-5xl font-bold text-slate-900">{hero?.title}</h1>
              <p className="mt-4 text-lg text-slate-600">{hero?.subtitle}</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-rose-200 bg-white p-2">
              {hero?.backgroundImage ? (
                <img
                  src={hero.backgroundImage}
                  alt="Trend hero"
                  className="h-full w-full rounded-[1.25rem] object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-xs uppercase tracking-[0.4em] text-slate-400">
                  Hero image
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-3xl border border-rose-200 bg-white">
              {story?.image ? (
                <img
                  src={story.image}
                  alt="Story"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-xs uppercase tracking-[0.4em] text-slate-400">
                  Story Image
                </div>
              )}
            </div>
            <div className="rounded-3xl border border-rose-200 bg-white p-8">
              <h2 className="text-3xl font-bold text-slate-900">{story?.heading}</h2>
              <div className="mt-4 space-y-4 text-slate-600">
                {story?.paragraphs?.map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {values?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-12">
            <h2 className="text-2xl font-bold text-slate-900">Why shoppers trust us</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-rose-200 bg-white p-5"
                >
                  <div className="mb-3 text-rose-500">
                    {iconMap[value.icon] || <Leaf size={30} />}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{value.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {team?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-12">
            <h2 className="text-2xl font-bold text-slate-900">Meet the team</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {team.map((member: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-rose-200 bg-white p-5 text-center"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="mx-auto h-28 w-28 rounded-full object-cover"
                  />
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{member.name}</h3>
                  <p className="text-sm text-rose-600">{member.role}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {stats?.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-12">
            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((item: any, i: number) => (
                <div
                  key={i}
                  className="rounded-2xl border border-rose-200 bg-gradient-to-br from-white to-rose-50 p-6"
                >
                  <p className="text-3xl font-bold text-slate-900">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <VendorStoriesSection
          stories={vendorStories}
          heading={vendorStoriesHeading}
          subtitle={vendorStoriesSubtitle}
          theme="trend"
        />

              </div>
    );
  }

  if (variant.key === "minimal") {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
        <section className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            About the brand
          </p>
          <h1 className="mt-4 text-5xl font-semibold">{hero?.title}</h1>
          <p className="mt-4 text-lg text-slate-600">{hero?.subtitle}</p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {story?.image ? (
                <img
                  src={story.image}
                  alt="Story"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-xs uppercase tracking-[0.4em] text-slate-400">
                  Story Image
                </div>
              )}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8">
              <h2 className="text-3xl font-semibold">{story?.heading}</h2>
              <div className="mt-4 space-y-4 text-slate-600">
                {story?.paragraphs?.map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {values?.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pb-16">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-3 text-slate-600">
                    {iconMap[value.icon] || <Leaf size={28} />}
                  </div>
                  <h3 className="text-lg font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {stats?.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pb-16">
            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((item: any, i: number) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <p className="text-3xl font-semibold">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <VendorStoriesSection
          stories={vendorStories}
          heading={vendorStoriesHeading}
          subtitle={vendorStoriesSubtitle}
          theme="minimal"
        />

              </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="relative h-96 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(color-mix(in srgb, var(--template-banner-color) 60%, transparent), color-mix(in srgb, var(--template-banner-color) 60%, transparent)), url('${hero?.backgroundImage}')`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-4">
              {hero?.title}
            </h1>
            <p className="text-xl lg:text-2xl">{hero?.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {story?.heading}
            </h2>
            {story?.paragraphs?.map((p: string, i: number) => (
              <p
                key={i}
                className="text-gray-700 text-lg leading-relaxed mb-4"
              >
                {p}
              </p>
            ))}
          </div>
          {story?.image && (
            <div>
              <img
                src={story.image}
                alt="Our story"
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Our Values */}
        {values?.length > 0 && (
          <div className="mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-12">
              Our Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center template-accent-soft template-accent">
                    {iconMap[value.icon] || <Leaf size={40} />}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Our Team */}
        {team?.length > 0 && (
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-4">
              Meet Our Team
            </h2>
            <p className="text-gray-600 text-lg text-center mb-12">
              The passionate people behind our journey.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member: any, index: number) => (
                <div key={index} className="text-center">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-48 h-48 mx-auto rounded-full object-cover mb-4 shadow-lg"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="font-medium template-accent">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Section */}
        {stats?.length > 0 && (
          <div className="mt-20 rounded-2xl p-12 template-accent-gradient">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {stats.map((item: any, i: number) => (
                <div key={i}>
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {item.value}
                  </div>
                  <div className="text-gray-600 text-lg">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <VendorStoriesSection
          stories={vendorStories}
          heading={vendorStoriesHeading}
          subtitle={vendorStoriesSubtitle}
          theme="classic"
        />

              </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 text-white w-12 h-12 rounded-md shadow-lg flex items-center justify-center transition-all transform hover:scale-105 z-50 template-accent-bg template-accent-bg-hover"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}

