import React from "react";
import {BookResult} from "./CodeCampInterfaces";

interface Props {
  bookResults: BookResult[] | undefined;
}

const BookResultsList: React.FunctionComponent<Props> = ({ bookResults }) => {
  function formatDatePretty(bookPublishedDate: string | undefined) {
    // No fallback to `new Date()`: under a static export, "now" is the
    // export/build time, not a real publish date (STATIC-SITE-PLAN.md
    // Step 2). Render blank instead of a wrong date.
    if (!bookPublishedDate) return "";
    return new Date(bookPublishedDate).toLocaleDateString("en-US"); // mm/dd/yyyy
  }

  if (!(bookResults && bookResults.length > 0)) return null;

  return (
    <section aria-labelledby="rd-ss-books-title">
      <h2 id="rd-ss-books-title" className="rd-h2">
        {bookResults.length == 1 ? "Speaker Book" : "Speaker Books"}
      </h2>

      <ul className="rd-grid rd-ss-books">
        {bookResults.map((bookResult, index) => {
          return (
            <li key={index}>
              <a className="rd-card rd-card--link rd-ss-book" target="_blank" href={bookResult.detailPageUrl}>
                <img src={bookResult.amazonImageSmall} alt="" />
                <div>
                  <h3 className="rd-h3">{bookResult.bookTitle}</h3>
                  <p>{bookResult.authors}</p>
                  <p>Published:&nbsp; {formatDatePretty(bookResult.bookPublishedDate)}</p>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default BookResultsList;
