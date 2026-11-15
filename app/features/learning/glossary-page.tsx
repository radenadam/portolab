import type { ReactNode } from "react";
import { data, redirect } from "react-router";
import { readLearningReturnPath } from "./read-learning-return-path.server";
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
  return glossaryResponse(
    glossarySearchData(
      readLearningPage(context, url, params.classId),
      url.searchParams.get("q"),
      readLearningReturnPath(url.searchParams.get("returnTo"), url),
    ),
  );
}

// A pasted query needs a validation page before it can become an address.
export async function action({
  context,
  params,
  url,
  request,
}: Route.ActionArgs) {
  const page = readLearningPage(context, url, params.classId);
  const form = await request.formData();
  const answer = glossarySearchData(
    page,
    form.get("q"),
    readLearningReturnPath(form.get("returnTo"), url),
  );
  if (answer.error !== undefined || url.searchParams.has("inPlace"))
    return glossaryResponse(answer);
  return redirect(
    glossaryPath(page.classId, answer.query, answer.returnTo),
    303,
  );
}

function glossarySearchData(
  { classId, content }: ReturnType<typeof readLearningPage>,
  value: unknown,
  returnTo: string | undefined,
) {
  const query = parseGlossaryQuery(value, m.learning_search_hint());
  return {
    classId,
    returnTo,
    query: query.ok ? query.value : typedText(value),
    terms: query.ok ? searchGlossary(content.terms, query.value) : [],
    sessions: content.sessions,
    error: query.ok ? undefined : query.failure,
  };
}

function glossaryResponse(answer: ReturnType<typeof glossarySearchData>) {
  return data(answer, { status: answer.error === undefined ? 200 : 400 });
}

export default function GlossaryPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  return <GlossaryView {...loaderData} {...actionData} />;
}
