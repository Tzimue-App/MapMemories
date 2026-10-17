import { TestBed } from '@angular/core/testing';
import { Dom, typeInto } from '../../../testing/dom';
import { fakeMediaService, provideFake } from '../../../testing/fakes';
import { MediaService } from '../../core/media.service';
import { PhotoUploader } from './photo-uploader';

describe('PhotoUploader', () => {
  let upload: ReturnType<typeof vi.fn<(file: File, caption?: string) => Promise<void>>>;

  beforeEach(() => {
    upload = vi.fn(async () => undefined);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: [provideFake(MediaService, fakeMediaService())] });
  });

  const render = async () => {
    const fixture = TestBed.createComponent(PhotoUploader);
    fixture.componentRef.setInput('upload', upload);
    await fixture.whenStable();
    return { fixture, dom: Dom.of(fixture) };
  };

  const pick = async (fixture: { whenStable(): Promise<unknown> }, dom: Dom, file: File) => {
    const input = dom.get<HTMLInputElement>('[data-testid="photo-file-input"]');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };

  const image = (size = 1024) => {
    const file = new File(['x'], 'pic.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  it('shows the drop zone with the size limit', async () => {
    const { dom } = await render();
    expect(dom.text()).toContain('Add Photo');
    expect(dom.text()).toContain('Max size 10MB');
  });

  it('rejects non-image files', async () => {
    const { fixture, dom } = await render();
    await pick(fixture, dom, new File(['x'], 'doc.pdf', { type: 'application/pdf' }));

    expect(dom.text()).toContain('Please select a valid image file (JPEG, PNG, WebP).');
    expect(dom.query('form')).toBeNull();
  });

  it('rejects images larger than 10MB', async () => {
    const { fixture, dom } = await render();
    await pick(fixture, dom, image(10 * 1024 * 1024 + 1));

    expect(dom.text()).toContain('Image file size must be less than 10MB.');
  });

  it('previews the selected image and uploads it with a caption', async () => {
    const { fixture, dom } = await render();
    const file = image();
    await pick(fixture, dom, file);

    expect(dom.get('img').getAttribute('src')).toBe('blob:http://localhost/preview');
    typeInto(dom.byPlaceholder(/photo description/i), 'Sunset');
    dom.button(/Save Photo/).click();
    await fixture.whenStable();

    expect(upload).toHaveBeenCalledWith(file, 'Sunset');
    expect(dom.query('form')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/preview');
  });

  it('sends no caption when the caption is blank', async () => {
    const { fixture, dom } = await render();
    const file = image();
    await pick(fixture, dom, file);

    typeInto(dom.byPlaceholder(/photo description/i), '   ');
    dom.get('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(upload).toHaveBeenCalledWith(file, undefined);
  });

  it('shows the upload error and keeps the selection', async () => {
    upload.mockRejectedValueOnce(new Error('Server says no'));
    const { fixture, dom } = await render();
    await pick(fixture, dom, image());

    dom.get('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(dom.text()).toContain('Server says no');
    expect(dom.query('form')).not.toBeNull();
  });

  it('removes the selection', async () => {
    const { fixture, dom } = await render();
    await pick(fixture, dom, image());

    dom.button('Remove selection').click();
    await fixture.whenStable();

    expect(dom.query('form')).toBeNull();
  });

  it('shows the saving state', async () => {
    const { fixture, dom } = await render();
    await pick(fixture, dom, image());
    fixture.componentRef.setInput('isLoading', true);
    await fixture.whenStable();

    const button = dom.button(/Saving Photo/);
    expect(button.disabled).toBe(true);
  });
});
