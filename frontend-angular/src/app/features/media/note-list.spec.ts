import { TestBed } from '@angular/core/testing';
import { Dom, typeInto } from '../../../testing/dom';
import { NoteItem } from '../../models/media';
import { NoteList } from './note-list';

describe('NoteList', () => {
  const notes: NoteItem[] = [
    { id: 1, modificationId: 10, content: 'First line\nSecond line', createdAt: '2026-10-02' },
    { id: 2, modificationId: 10, content: 'Another', createdAt: '2026-10-03' },
  ];

  const render = async (list: NoteItem[], deleteNote?: (id: number) => Promise<void>) => {
    const addNote = vi.fn(async (_content: string) => undefined);
    const fixture = TestBed.createComponent(NoteList);
    fixture.componentRef.setInput('notes', list);
    fixture.componentRef.setInput('addNote', addNote);
    if (deleteNote) fixture.componentRef.setInput('deleteNote', deleteNote);
    await fixture.whenStable();
    return { fixture, dom: Dom.of(fixture), addNote };
  };

  it('shows an empty message and a disabled save button', async () => {
    const { dom } = await render([]);

    expect(dom.text()).toContain('No notes added yet.');
    expect(dom.button(/Save Note/).disabled).toBe(true);
  });

  it('renders multi-line notes', async () => {
    const { dom } = await render(notes);

    const paragraph = dom.byText('First line\nSecond line', 'p');
    expect(paragraph.className).toContain('whitespace-pre-wrap');
  });

  it('adds a trimmed note and clears the textarea', async () => {
    const { fixture, dom, addNote } = await render([]);
    const textarea = dom.byPlaceholder<HTMLTextAreaElement>(/add a detailed note/i);

    typeInto(textarea, '  A memory  ');
    await fixture.whenStable();
    dom.button(/Save Note/).click();
    await fixture.whenStable();

    expect(addNote).toHaveBeenCalledWith('A memory');
    expect(textarea.value).toBe('');
  });

  it('only offers deletion when allowed', async () => {
    const { dom } = await render(notes);
    expect(dom.allButtons('Delete Note')).toHaveLength(0);
  });

  it('deletes a note', async () => {
    const deleteNote = vi.fn(async () => undefined);
    const { dom } = await render(notes, deleteNote);

    dom.allButtons('Delete Note')[1].click();

    expect(deleteNote).toHaveBeenCalledWith(2);
  });
});
