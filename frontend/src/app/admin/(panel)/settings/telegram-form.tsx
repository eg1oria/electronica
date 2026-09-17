"use client";

import { useActionState, useState, useTransition } from "react";
import {
  clearTelegram,
  detectTelegramChats,
  saveTelegram,
  testTelegram,
} from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/controls";
import { Card, Field, FormError } from "@/components/admin/ui";
import { CheckIcon, SendIcon } from "@/components/icons";
import { Button, inputClass } from "@/components/ui";
import type { TelegramChat, TelegramSettings } from "@/lib/admin/types";

const STEPS = [
  "Напишите @BotFather в Telegram, отправьте /newbot и скопируйте токен.",
  "Вставьте токен сюда и нажмите «Сохранить».",
  "Откройте своего бота и отправьте ему /start — или добавьте его в рабочую группу.",
  "Нажмите «Определить чат», выберите нужный и отправьте тестовое сообщение.",
];

export function TelegramForm({ settings }: { settings: TelegramSettings }) {
  const [state, action] = useActionState(saveTelegram, undefined);
  const [chatId, setChatId] = useState(settings.chatId ?? "");
  const [chats, setChats] = useState<TelegramChat[]>();
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>();
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok?: string; error?: string }>) {
    setNotice(undefined);
    startTransition(async () => setNotice(await task()));
  }

  const sendTest = () =>
    run(async () => {
      const result = await testTelegram();
      return result?.error
        ? { error: result.error }
        : { ok: "Сообщение отправлено — проверьте чат" };
    });

  const detect = () =>
    run(async () => {
      const result = await detectTelegramChats();
      if ("error" in result) return { error: result.error };
      setChats(result.chats);
      return result.chats.length
        ? {}
        : {
            error:
              "Бот пока не получал сообщений. Отправьте ему /start и попробуйте снова",
          };
    });

  const disconnect = () => {
    if (!confirm("Отключить бота? Токен и чат будут удалены.")) return;
    run(async () => {
      const result = await clearTelegram();
      if (result?.error) return { error: result.error };
      setChatId("");
      setChats(undefined);
      return { ok: "Бот отключён" };
    });
  };

  return (
    <Card title="Уведомления о заказах в Telegram">
      <p className="text-sm text-muted">
        Каждый новый заказ приходит в Telegram — сразу с составом, суммой и
        контактами покупателя.
      </p>
      <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-muted marker:text-muted">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <form action={action} className="mt-6 space-y-4">
        <Field
          label="Токен бота"
          hint={
            settings.tokenPreview
              ? `Сохранён токен ${settings.tokenPreview}${settings.botUsername ? ` (@${settings.botUsername})` : ""}. Пусто — оставить прежний.`
              : "Вида 123456789:AAH... — его выдаёт @BotFather"
          }
        >
          <input
            type="password"
            name="botToken"
            maxLength={200}
            autoComplete="off"
            placeholder={settings.tokenPreview ?? "123456789:AAH…"}
            className={inputClass}
          />
        </Field>

        <Field
          label="Чат для уведомлений"
          hint="Личный чат с ботом, группа или канал. Можно определить автоматически."
        >
          <div className="flex flex-wrap gap-2">
            <input
              name="chatId"
              value={chatId}
              onChange={(e) => setChatId(e.currentTarget.value.trim())}
              maxLength={64}
              inputMode="text"
              placeholder="123456789 или -1001234567890"
              className={`${inputClass} min-w-0 flex-1`}
            />
            <Button
              variant="secondary"
              onClick={detect}
              disabled={pending || !settings.tokenPreview}
            >
              Определить чат
            </Button>
          </div>
        </Field>

        {chats && chats.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Button
                  variant={chat.id === chatId ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setChatId(chat.id)}
                >
                  {chat.id === chatId && <CheckIcon size={14} />}
                  {chat.title}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={settings.enabled}
            className="size-4 accent-accent"
          />
          Присылать уведомления о новых заказах
        </label>

        <FormError message={state?.error ?? notice?.error} />
        {notice?.ok && (
          <p className="rounded-btn bg-success/10 px-3.5 py-2.5 text-sm text-success">
            {notice.ok}
          </p>
        )}
        {state?.ok && !notice && (
          <p className="rounded-btn bg-success/10 px-3.5 py-2.5 text-sm text-success">
            Настройки сохранены
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <SubmitButton>Сохранить</SubmitButton>
          <Button
            variant="secondary"
            onClick={sendTest}
            disabled={pending || !settings.tokenPreview}
          >
            <SendIcon size={16} />
            {pending ? "Отправка…" : "Отправить тест"}
          </Button>
          {settings.tokenPreview && (
            <span className="ml-auto">
              <Button
                variant="ghost"
                onClick={disconnect}
                disabled={pending}
                className="text-danger"
              >
                Отключить бота
              </Button>
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
