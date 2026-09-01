function initQuiz(root: HTMLElement) {
  const options = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-option]'));
  const feedback = root.querySelector<HTMLElement>('[data-quiz-feedback]');
  let answered = false;

  options.forEach((button) => {
    button.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const correct = button.dataset.correct === 'true';

      options.forEach((opt) => {
        opt.disabled = true;
        opt.classList.remove('hover:border-slate-500');
        if (opt.dataset.correct === 'true') {
          opt.classList.add('!border-slate-400', '!bg-slate-800');
        }
      });

      if (!correct) {
        button.classList.add('!border-slate-500', 'line-through', 'opacity-60');
      }

      if (feedback) {
        feedback.hidden = false;
        feedback.textContent = correct
          ? (feedback.dataset.correctText ?? 'Correct.')
          : (feedback.dataset.incorrectText ?? 'Not quite — the right answer is highlighted above.');
        feedback.classList.toggle('text-slate-300', correct);
        feedback.classList.toggle('text-slate-400', !correct);
      }
    });
  });
}

function initAllQuizzes() {
  document.querySelectorAll<HTMLElement>('[data-quiz]').forEach(initQuiz);
}

initAllQuizzes();
