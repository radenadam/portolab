import type { ReactNode } from "react";
import { data, redirect } from "react-router";
import { typedText } from "~/form-text";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/glossary-page";
import { parseGlossaryQuery, searchGlossary } from "./glossary-search";
import { GlossaryView } from "./glossary-view";
import { glossaryPath } from "./learning-paths";
import { readLearningPage } from "./read-learning-page.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.learning_glossary_title()) }];
}

export function loader({ context, params, url }: Route.LoaderArgs) {
  const { classId, content } = readLearningPage(context, url, params.classId);
  const value = url.searchParams.get("q");
  const query = parseGlossaryQuery(value, m.learning_search_hint());
  return data(
    {
      classId,
      query: query.ok ? query.value : typedText(value),
      terms: query.ok ? searchGlossary(content.terms, query.value) : [],
      sessions: content.sessions,
      error: query.ok ? undefined : query.failure,
    },
    { status: query.ok ? 200 : 400 },
  );
}

// A pasted query needs a validation page before it can become an address.
export async function action({
  context,
  params,
  url,
  request,
}: Route.ActionArgs) {
  const { classId } = readLearningPage(context, url, params.classId);
  const form = await request.formData();
  const value = form.get("q");
  const query = parseGlossaryQuery(value, m.learning_search_hint());
  if (!query.ok)
    return data(
      { query: typedText(value), error: query.failure },
      { status: 400 },
    );
  return redirect(glossaryPath(classId, query.value), 303);
}

export default function GlossaryPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  return <GlossaryView {...loaderData} {...actionData} />;
}
