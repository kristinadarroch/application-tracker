import { quoteReviewQuestions } from '../quotes';

const reviews = `Three rounds over two weeks. The recruiter screen was friendly.
In the technical round they asked me to design an offline sync queue for a mobile app! Then we talked about conflict resolution.
The hiring manager asked: "Tell me about a time you disagreed with a designer. What did you do?" I talked about a launch.`;

describe('quoteReviewQuestions (LATER-1)', () => {
  it('quotes the review sentence that shares the most content words', () => {
    expect(quoteReviewQuestions(['How would you design an offline sync queue?'], reviews)).toEqual([
      {
        question: 'How would you design an offline sync queue?',
        quote:
          'In the technical round they asked me to design an offline sync queue for a mobile app!',
      },
    ]);
  });

  it('keeps a quoted span intact even when it contains sentence breaks', () => {
    const [quoted] = quoteReviewQuestions(
      ['Describe a time you disagreed with a designer.'],
      reviews,
    );
    expect(quoted?.quote).toBe(
      'The hiring manager asked: "Tell me about a time you disagreed with a designer. What did you do?"',
    );
  });

  it('drops a question that no sentence supports with at least 2 content words', () => {
    expect(
      quoteReviewQuestions(
        ['Reverse a linked list.', 'Why do you want this mobile role?'],
        reviews,
      ),
    ).toEqual([]);
  });

  it('ignores blank and duplicate questions', () => {
    const quoted = quoteReviewQuestions(
      ['  ', 'Design an offline sync queue.', 'design an offline sync queue.'],
      reviews,
    );
    expect(quoted.map((q) => q.question)).toEqual(['Design an offline sync queue.']);
  });
});
