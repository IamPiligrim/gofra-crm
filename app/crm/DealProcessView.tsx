import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BRIEF_ASSET_KINDS,
  BRIEF_ASSET_LABELS,
  BRIEF_ASSET_STATUS_LABELS,
  CARDBOARD_GRADES,
  COATINGS,
  DEAL_PROCESS_STEPS,
  DEAL_PROCESS_STEP_LABELS,
  FEFCO_CODES,
  FLUTE_PROFILES,
  PACKAGING_TYPES,
  PACKING_METHODS,
  PRINT_METHODS,
  getDealBriefCompletion,
  getDealProcessCompletion,
  getQuoteMargin,
  getQuoteMarginPercent,
  type BriefAssetKind,
  type BriefDimensions,
  type Deal,
  type DealBrief,
  type DealProcessStep,
  type Quote,
  type QuoteStatus,
  type User,
} from "./domain";

const MONEY = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const formatDate = (value: string | null): string => {
  if (!value) return "Не задано";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("ru-RU").format(parsed);
};

const dateValue = (value: string | null): string => value?.slice(0, 10) ?? "";
const toIsoDate = (value: string): string | null =>
  value ? `${value}T09:00:00.000Z` : null;

const numberOrNull = (value: string): number | null => {
  if (!value.trim()) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};

const BRIEF_STEPS = [
  { id: "construction", label: "Конструкция", caption: "Вид, FEFCO и размеры" },
  { id: "material", label: "Материал", caption: "Картон, печать и покрытие" },
  { id: "operation", label: "Эксплуатация", caption: "Объёмы и условия" },
  { id: "source", label: "Исходные данные", caption: "Поставщик, проблема и файлы" },
] as const;

function TextField({
  label,
  value,
  onChange,
  type = "text",
  min,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  min?: number;
}) {
  return (
    <label className="deal-process-field">
      <span>{label}</span>
      <input
        min={min}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="deal-process-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">Не выбрано</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function DimensionFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BriefDimensions;
  onChange: (value: BriefDimensions) => void;
}) {
  const update = (key: keyof BriefDimensions, raw: string) =>
    onChange({ ...value, [key]: numberOrNull(raw) });
  return (
    <fieldset className="deal-dimensions">
      <legend>{label}, мм</legend>
      <TextField label="Длина" min={0} onChange={(raw) => update("length", raw)} type="number" value={value.length ?? ""} />
      <TextField label="Ширина" min={0} onChange={(raw) => update("width", raw)} type="number" value={value.width ?? ""} />
      <TextField label="Высота" min={0} onChange={(raw) => update("height", raw)} type="number" value={value.height ?? ""} />
    </fieldset>
  );
}

function BriefStepFields({
  step,
  brief,
  onChange,
}: {
  step: number;
  brief: DealBrief;
  onChange: (brief: DealBrief) => void;
}) {
  const set = <K extends keyof DealBrief>(key: K, value: DealBrief[K]) =>
    onChange({ ...brief, [key]: value });
  const updateAsset = (
    kind: BriefAssetKind,
    patch: Partial<DealBrief["assets"][BriefAssetKind]>,
  ) =>
    set("assets", {
      ...brief.assets,
      [kind]: { ...brief.assets[kind], ...patch },
    });

  if (step === 0) {
    return (
      <div className="deal-brief-fields">
        <SelectField label="Вид упаковки" onChange={(value) => set("packagingType", value)} options={PACKAGING_TYPES} value={brief.packagingType} />
        <SelectField label="Конструкция FEFCO" onChange={(value) => set("fefco", value)} options={FEFCO_CODES} value={brief.fefco} />
        <DimensionFields label="Внутренние размеры" onChange={(value) => set("innerDimensions", value)} value={brief.innerDimensions} />
        <DimensionFields label="Внешние размеры" onChange={(value) => set("outerDimensions", value)} value={brief.outerDimensions} />
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="deal-brief-fields">
        <SelectField label="Марка картона" onChange={(value) => set("cardboardGrade", value)} options={CARDBOARD_GRADES} value={brief.cardboardGrade} />
        <SelectField label="Профиль гофры" onChange={(value) => set("fluteProfile", value)} options={FLUTE_PROFILES} value={brief.fluteProfile} />
        <SelectField label="Печать" onChange={(value) => set("printMethod", value)} options={PRINT_METHODS} value={brief.printMethod} />
        <TextField label="Количество цветов" min={0} onChange={(value) => set("printColors", numberOrNull(value))} type="number" value={brief.printColors ?? ""} />
        <SelectField label="Покрытие" onChange={(value) => set("coating", value)} options={COATINGS} value={brief.coating} />
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="deal-brief-fields">
        <TextField label="Объём одной партии" onChange={(value) => set("batchVolume", value)} value={brief.batchVolume} />
        <TextField label="Потребление в месяц" onChange={(value) => set("monthlyVolume", value)} value={brief.monthlyVolume} />
        <TextField label="Потребление в год" onChange={(value) => set("annualVolume", value)} value={brief.annualVolume} />
        <SelectField label="Способ упаковки" onChange={(value) => set("packingMethod", value as DealBrief["packingMethod"])} options={PACKING_METHODS} value={brief.packingMethod} />
        <TextField label="Требования к нагрузке" onChange={(value) => set("loadRequirement", value)} value={brief.loadRequirement} />
        <TextField label="Хранение" onChange={(value) => set("storageRequirement", value)} value={brief.storageRequirement} />
        <TextField label="Паллетирование" onChange={(value) => set("palletizing", value)} value={brief.palletizing} />
      </div>
    );
  }
  return (
    <div className="deal-brief-fields">
      <TextField label="Текущий поставщик" onChange={(value) => set("currentSupplier", value)} value={brief.currentSupplier} />
      <TextField label="Текущая цена, ₽" min={0} onChange={(value) => set("currentPrice", numberOrNull(value))} type="number" value={brief.currentPrice ?? ""} />
      <label className="deal-process-field is-wide">
        <span>Проблема клиента</span>
        <textarea onChange={(event) => set("clientProblem", event.target.value)} rows={3} value={brief.clientProblem} />
      </label>
      <div className="deal-brief-assets">
        {BRIEF_ASSET_KINDS.map((kind) => (
          <article key={kind}>
            <strong>{BRIEF_ASSET_LABELS[kind]}</strong>
            <select onChange={(event) => updateAsset(kind, { status: event.target.value as DealBrief["assets"][BriefAssetKind]["status"] })} value={brief.assets[kind].status}>
              {Object.entries(BRIEF_ASSET_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input aria-label={`Комментарий: ${BRIEF_ASSET_LABELS[kind]}`} onChange={(event) => updateAsset(kind, { note: event.target.value })} placeholder="Файл или пометка" value={brief.assets[kind].note} />
            <label className="deal-brief-file">
              <span>Прикрепить файл</span>
              <input
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf"
                aria-label={`Прикрепить: ${BRIEF_ASSET_LABELS[kind]}`}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    updateAsset(kind, {
                      status: "received",
                      note: `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} КБ`,
                    });
                  }
                }}
                type="file"
              />
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}

export function DealProcessView({
  deal,
  quotes,
  users,
  currentUser,
  showFinancials,
  onChange,
}: {
  deal: Deal;
  quotes: Quote[];
  users: User[];
  currentUser: User;
  showFinancials: boolean;
  onChange: (deal: Deal, quotes: Quote[]) => void;
}) {
  const [briefStep, setBriefStep] = useState(0);
  const [briefDraft, setBriefDraft] = useState(deal.brief);
  const [quoteError, setQuoteError] = useState("");
  useEffect(() => {
    setBriefDraft(deal.brief);
    setBriefStep(0);
  }, [deal.id]);

  const dealQuotes = useMemo(
    () =>
      quotes
        .filter((quote) => quote.dealId === deal.id)
        .sort((left, right) => right.version - left.version),
    [deal.id, quotes],
  );
  const activeQuote = dealQuotes.find((quote) => quote.id === deal.activeQuoteId);
  const briefCompletion = getDealBriefCompletion(briefDraft);
  const processCompletion = getDealProcessCompletion(deal.process);

  const saveBrief = () => {
    const now = new Date().toISOString();
    onChange(
      {
        ...deal,
        brief: { ...briefDraft, updatedAt: now },
        updatedAt: now,
      },
      quotes,
    );
  };

  const updateProcess = (
    step: DealProcessStep,
    completedAt: string | null,
  ) => {
    const now = new Date().toISOString();
    onChange(
      {
        ...deal,
        process: {
          ...deal.process,
          steps: {
            ...deal.process.steps,
            [step]: {
              ...deal.process.steps[step],
              completedAt,
              completedById: completedAt ? currentUser.id : null,
            },
          },
          updatedAt: now,
        },
        updatedAt: now,
      },
      quotes,
    );
  };

  const changeReplyDate = (value: string) => {
    const now = new Date().toISOString();
    onChange(
      {
        ...deal,
        process: {
          ...deal.process,
          replyExpectedAt: toIsoDate(value),
          updatedAt: now,
        },
        updatedAt: now,
      },
      quotes,
    );
  };

  const changeForecastDate = (value: string) => {
    const now = new Date().toISOString();
    onChange(
      {
        ...deal,
        forecastCloseAt: toIsoDate(value),
        updatedAt: now,
      },
      quotes,
    );
  };

  const addQuote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const changeReason = String(data.get("changeReason") ?? "").trim();
    const status = String(data.get("status") ?? "Черновик") as QuoteStatus;
    if (dealQuotes.length && !changeReason) {
      setQuoteError("Для новой версии укажите причину изменения.");
      return;
    }
    if (status === "Отправлено" && !deal.process.replyExpectedAt) {
      setQuoteError("Для отправленного КП укажите дату ожидаемого ответа.");
      return;
    }
    const now = new Date().toISOString();
    const version = Math.max(0, ...dealQuotes.map((quote) => quote.version)) + 1;
    const revenue = Math.max(0, Number(data.get("revenue") ?? 0));
    const cost = showFinancials
      ? Math.max(0, Number(data.get("cost") ?? 0))
      : (activeQuote?.cost ?? deal.purchasePrice);
    const logistics = showFinancials
      ? Math.max(0, Number(data.get("logistics") ?? 0))
      : (activeQuote?.logistics ?? deal.logistics);
    const quote: Quote = {
      id: `quote-${deal.id}-${Date.now()}`,
      dealId: deal.id,
      version,
      status,
      revenue,
      cost,
      logistics,
      volume: String(data.get("volume") ?? deal.volume),
      validUntil: String(data.get("validUntil") ?? "") || null,
      changeReason,
      sentAt: status === "Отправлено" ? now : null,
      authorId: currentUser.id,
      comment: String(data.get("comment") ?? ""),
      createdAt: now,
      updatedAt: now,
    };
    const nextQuotes = quotes.map((candidate) =>
      candidate.id === deal.activeQuoteId &&
      !["Принято", "Отклонено"].includes(candidate.status)
        ? { ...candidate, status: "Заменено" as const, updatedAt: now }
        : candidate,
    );
    nextQuotes.push(quote);
    const margin = getQuoteMargin(quote);
    const nextDeal: Deal = {
      ...deal,
      activeQuoteId: quote.id,
      clientPrice: revenue,
      ourPrice: revenue,
      purchasePrice: cost,
      logistics,
      margin,
      marginPercent: getQuoteMarginPercent(quote),
      proposalDate: quote.sentAt?.slice(0, 10) ?? null,
      process:
        status === "Отправлено"
          ? {
              ...deal.process,
              steps: {
                ...deal.process.steps,
                quoteSent: {
                  completedAt: now,
                  completedById: currentUser.id,
                  note: "",
                },
              },
              updatedAt: now,
            }
          : deal.process,
      updatedAt: now,
    };
    setQuoteError("");
    event.currentTarget.reset();
    onChange(nextDeal, nextQuotes);
  };

  const resolveQuote = (quoteId: string, status: "Принято" | "Отклонено") => {
    const now = new Date().toISOString();
    onChange(
      { ...deal, updatedAt: now },
      quotes.map((quote) =>
        quote.id === quoteId ? { ...quote, status, updatedAt: now } : quote,
      ),
    );
  };

  return (
    <div className="deal-process-workflow">
      <section className="deal-brief-panel">
        <header>
          <div>
            <span className="section-kicker">Потребность в упаковке</span>
            <h3>Технический бриф</h3>
          </div>
          <span className="deal-workflow-progress">
            {briefCompletion.filled}/{briefCompletion.total}
          </span>
        </header>
        <nav aria-label="Этапы технического брифа" className="deal-brief-steps">
          {BRIEF_STEPS.map((step, index) => (
            <button aria-current={briefStep === index ? "step" : undefined} className={briefStep === index ? "is-active" : ""} key={step.id} onClick={() => setBriefStep(index)} type="button">
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
              <small>{step.caption}</small>
            </button>
          ))}
        </nav>
        <BriefStepFields brief={briefDraft} onChange={setBriefDraft} step={briefStep} />
        <footer className="deal-brief-actions">
          <button className="ghost-button" disabled={briefStep === 0} onClick={() => setBriefStep((value) => Math.max(0, value - 1))} type="button">Назад</button>
          <button className="primary-button" onClick={saveBrief} type="button">Сохранить этап</button>
          <button className="ghost-button" disabled={briefStep === BRIEF_STEPS.length - 1} onClick={() => setBriefStep((value) => Math.min(BRIEF_STEPS.length - 1, value + 1))} type="button">Далее</button>
        </footer>
      </section>

      <section className="deal-process-panel">
        <header>
          <div>
            <span className="section-kicker">Расчёт, образец и КП</span>
            <h3>Этапы сделки</h3>
          </div>
          <span className="deal-workflow-progress">{processCompletion.filled}/{processCompletion.total}</span>
        </header>
        <label className="deal-sample-skip">
          <input checked={deal.process.sampleSkipped} onChange={(event) => {
            const now = new Date().toISOString();
            onChange({ ...deal, updatedAt: now, process: { ...deal.process, sampleSkipped: event.target.checked, updatedAt: now } }, quotes);
          }} type="checkbox" />
          Образец не требуется
        </label>
        <div className="deal-milestones">
          {DEAL_PROCESS_STEPS.filter((step) => !deal.process.sampleSkipped || !step.startsWith("sample")).map((step) => {
            const milestone = deal.process.steps[step];
            return (
              <article className={milestone.completedAt ? "is-complete" : ""} key={step}>
                <button aria-label={milestone.completedAt ? `Снять отметку «${DEAL_PROCESS_STEP_LABELS[step]}»` : `Отметить «${DEAL_PROCESS_STEP_LABELS[step]}»`} onClick={() => updateProcess(step, milestone.completedAt ? null : new Date().toISOString())} type="button">{milestone.completedAt ? "✓" : ""}</button>
                <strong>{DEAL_PROCESS_STEP_LABELS[step]}</strong>
                <input aria-label={`Дата: ${DEAL_PROCESS_STEP_LABELS[step]}`} onChange={(event) => updateProcess(step, toIsoDate(event.target.value))} type="date" value={dateValue(milestone.completedAt)} />
              </article>
            );
          })}
        </div>
        <div className="deal-process-dates">
          <label className="deal-reply-date">
            <span>Прогнозная дата закрытия</span>
            <input onChange={(event) => changeForecastDate(event.target.value)} type="date" value={dateValue(deal.forecastCloseAt)} />
          </label>
          <label className="deal-reply-date">
            <span>Ответ клиента ожидается до</span>
            <input onChange={(event) => changeReplyDate(event.target.value)} type="date" value={dateValue(deal.process.replyExpectedAt)} />
          </label>
        </div>
      </section>

      <section className="deal-quotes-panel">
        <header>
          <div>
            <span className="section-kicker">Коммерческие условия</span>
            <h3>Версии КП</h3>
          </div>
          <span className="deal-workflow-progress">{dealQuotes.length}</span>
        </header>
        <form className="deal-quote-form" onSubmit={addQuote}>
          <label><span>Выручка, ₽</span><input defaultValue={activeQuote?.revenue ?? deal.ourPrice} min="0" name="revenue" required type="number" /></label>
          {showFinancials ? <label><span>Себестоимость, ₽</span><input defaultValue={activeQuote?.cost ?? deal.purchasePrice} min="0" name="cost" required type="number" /></label> : null}
          {showFinancials ? <label><span>Логистика, ₽</span><input defaultValue={activeQuote?.logistics ?? deal.logistics} min="0" name="logistics" required type="number" /></label> : null}
          <label><span>Объём</span><input defaultValue={activeQuote?.volume ?? deal.volume} name="volume" required /></label>
          <label><span>Действует до</span><input defaultValue={dateValue(activeQuote?.validUntil ?? null)} name="validUntil" required type="date" /></label>
          <label><span>Статус</span><select defaultValue="Черновик" name="status"><option>Черновик</option><option>Отправлено</option></select></label>
          <label className="is-wide"><span>Причина изменения{dealQuotes.length ? " · обязательно" : ""}</span><input name="changeReason" required={dealQuotes.length > 0} /></label>
          <label className="is-wide"><span>Комментарий</span><textarea name="comment" rows={2} /></label>
          {quoteError ? <p className="deal-quote-error" role="alert">{quoteError}</p> : null}
          <button className="primary-button" type="submit">Создать версию КП</button>
        </form>
        <div className="deal-quote-history">
          {dealQuotes.map((quote) => (
            <article className={quote.id === deal.activeQuoteId ? "is-active" : ""} key={quote.id}>
              <header>
                <div><strong>КП · версия {quote.version}</strong><small>{formatDate(quote.createdAt)} · {users.find((user) => user.id === quote.authorId)?.fullName ?? "Автор не найден"}</small></div>
                <span className={`quote-status status-${quote.status.toLocaleLowerCase("ru-RU")}`}>{quote.status}</span>
              </header>
              <dl>
                <div><dt>Выручка</dt><dd>{MONEY.format(quote.revenue)}</dd></div>
                {showFinancials ? <div><dt>Себестоимость</dt><dd>{MONEY.format(quote.cost)}</dd></div> : null}
                {showFinancials ? <div><dt>Логистика</dt><dd>{MONEY.format(quote.logistics)}</dd></div> : null}
                {showFinancials ? <div><dt>Маржа</dt><dd>{MONEY.format(getQuoteMargin(quote))} · {getQuoteMarginPercent(quote)}%</dd></div> : null}
                <div><dt>Объём</dt><dd>{quote.volume}</dd></div>
                <div><dt>Действует до</dt><dd>{formatDate(quote.validUntil)}</dd></div>
              </dl>
              {quote.changeReason ? <p><strong>Причина:</strong> {quote.changeReason}</p> : null}
              {quote.comment ? <p>{quote.comment}</p> : null}
              {quote.id === deal.activeQuoteId && quote.status === "Отправлено" ? (
                <footer><button onClick={() => resolveQuote(quote.id, "Принято")} type="button">Клиент принял</button><button onClick={() => resolveQuote(quote.id, "Отклонено")} type="button">Клиент отказался</button></footer>
              ) : null}
            </article>
          ))}
          {!dealQuotes.length ? <p className="muted-copy">Версий КП пока нет.</p> : null}
        </div>
      </section>
    </div>
  );
}
