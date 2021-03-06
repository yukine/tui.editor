import TuiEditor from '../../src/js/editor';
import SectionManager from '../../src/js/extensions/scrollFollow.sectionManager';

const loadStyleFixtures = window.loadStyleFixtures;

describe('scrollFollow.sectionManager', () => {
    let ned, sectionManager;

    beforeEach(() => {
        jasmine.getStyleFixtures().fixturesPath = '/base';
        loadStyleFixtures('lib/codemirror/lib/codemirror.css');
        $('body').html('<div id="editSection"></div>');

        ned = new TuiEditor({
            el: $('#editSection'),
            previewStyle: 'vertical',
            height: 100,
            initialEditType: 'markdown',
            events: {
                'load': function(editor) {
                    editor.getCodeMirror().setSize(200, 50);
                    $('.preview').css('padding', '0');
                    $('.preview').css('overflow', 'auto');
                    sectionManager = new SectionManager(editor.getCodeMirror(), editor.preview);
                }
            }
        });
    });

    // we need to wait squire input event process
    afterEach(done => {
        setTimeout(() => {
            $('body').empty();
            done();
        });
    });

    describe('sectionManager', () => {
        it('make new section', () => {
            sectionManager._sectionList = [];

            sectionManager._addNewSection(0, 1);

            const sectionList = sectionManager.getSectionList();

            expect(sectionList.length).toEqual(1);
            expect(sectionList[0].start).toEqual(0);
            expect(sectionList[0].end).toEqual(1);
        });

        it('update current section', () => {
            sectionManager._sectionList = [];
            sectionManager._addNewSection(0, 1);
            sectionManager._updateCurrentSectionEnd(3);

            expect(sectionManager.getSectionList()[0].end).toEqual(3);
        });

        it('iterate each line with info', () => {
            const lineType = [];

            ned.setValue([
                'paragraph',
                '# header1',
                ' ',
                'paragraph',
                '## header2',
                'paragraph'
            ].join('\n'));

            sectionManager._eachLineState((isSection, lineNumber) => {
                lineType[lineNumber] = isSection;
            });

            expect(lineType[0]).toEqual(false);
            expect(lineType[1]).toEqual(true);
        });

        it('trimming top lines while _eachLineState', () => {
            const lineType = [];

            ned.setValue([
                ' ',
                '',
                'paragraph',
                '# header1',
                ' ',
                'paragraph',
                '## header2',
                'paragraph'
            ].join('\n'));

            sectionManager._eachLineState((isSection, lineNumber) => {
                lineType[lineNumber] = isSection;
            });

            expect(lineType[0]).toBeUndefined();
            expect(lineType[1]).toBeUndefined();
            expect(lineType[2]).toEqual(false);
            expect(lineType[3]).toEqual(true);
        });


        it('make section list', () => {
            ned.setValue([
                'paragraph',
                '# header1',
                'paragraph',
                '## header2',
                'paragraph'
            ].join('\n'));


            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(3);
        });

        it('dont make section with only #', () => {
            ned.setValue([
                'paragraph',
                '# header1',
                'paragraph',
                '##not header',
                'paragraph'
            ].join('\n'));


            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(2);
        });

        it('make section list with default section ', () => {
            ned.setValue([
                ' ',
                '***',
                'paragraph'
            ].join('\n'));


            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(1);
        });

        it('make section list use default section if first contents is header ', () => {
            ned.setValue([
                '# header',
                '***',
                'paragraph'
            ].join('\n'));


            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(1);
        });


        it('make section list with setext type header ', () => {
            ned.setValue([
                'paragraph',
                'header1',
                '=======',
                'paragraph',
                'header2',
                '------',
                'paragraph'
            ].join('\n'));


            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(3);
        });

        it('dont make section with line', () => {
            ned.setValue([
                'paragraph',
                'header1',
                '=======',
                'paragraph',
                ' ',
                '------',
                'paragraph'
            ].join('\n'));


            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(2);
        });

        it('dont make section with line followed by table', () => {
            ned.setValue([
                'paragraph',
                'header1',
                '=======',
                'paragraph',
                '| th | th |',
                '| -- | -- |',
                '| td | td |',
                '------',
                'paragraph'
            ].join('\n'));


            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(2);
        });

        it('any problem with table in bottom', () => {
            ned.setValue([
                'paragraph',
                'header1',
                '=======',
                'paragraph',
                '| th | th |',
                '| -- | -- |',
                '| td | td |'
            ].join('\n'));

            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(2);
        });

        it('any problem with table with space', () => {
            ned.setValue([
                'paragraph',
                'header1',
                '=======',
                'paragraph',
                '  | th | th |',
                '| -- | -- |',
                '| td | td |'
            ].join('\n'));

            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(2);
        });

        it('dont make section with line followed by codeBlock', () => {
            ned.setValue([
                'paragraph',
                'header1',
                '=======',
                '``` javascript',
                'const mm = 1;',
                '```',
                '------',
                'paragraph'
            ].join('\n'));


            sectionManager.makeSectionList();

            expect(sectionManager.getSectionList().length).toEqual(2);
        });

        it('section list have line info', () => {
            ned.setValue([
                'paragraph',
                '# header1',
                'paragraph',
                'paragraph',
                '## header2',
                'paragraph'
            ].join('\n'));

            sectionManager.makeSectionList();

            const sectionList = sectionManager.getSectionList();

            expect(sectionList[0].start).toEqual(0);
            expect(sectionList[0].end).toEqual(0);
            expect(sectionList[1].start).toEqual(1);
            expect(sectionList[1].end).toEqual(3);
            expect(sectionList[2].start).toEqual(4);
            expect(sectionList[2].end).toEqual(5);
        });

        it('section match with preview', done => {
            ned.setValue([
                'paragraph',
                '# header1',
                'paragraph',
                'paragraph',
                '## header2',
                'paragraph'
            ].join('\n'));

            sectionManager.makeSectionList();

            ned.on('previewRenderAfter', () => {
                sectionManager.sectionMatch();
                const sectionList = sectionManager.getSectionList();

                expect(sectionList.length).toEqual(3);
                expect(sectionList[0].$previewSectionEl.hasClass('content-id-0')).toBe(true);
                expect(sectionList[1].$previewSectionEl.hasClass('content-id-1')).toBe(true);
                expect(sectionList[2].$previewSectionEl.hasClass('content-id-2')).toBe(true);
                done();
            });
        });

        it('find section with markdown line', () => {
            ned.setValue([
                'paragraph',
                '# header1',
                'paragraph',
                'paragraph',
                '## header2',
                'paragraph'
            ].join('\n'));

            sectionManager.makeSectionList();
            const sectionList = sectionManager.getSectionList();

            expect(sectionManager.sectionByLine(3)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(99999)).toBe(sectionList[2]);
        });

        it('create new section of image where at root level', () => {
            ned.setValue([
                'paragraph',
                '# header1',
                'paragraph',
                'paragraph',
                '',
                '![nhnent](http://www.nhnent.com)',
                '',
                '## header2',
                'paragraph'
            ].join('\n'));

            sectionManager.makeSectionList();
            const sectionList = sectionManager.getSectionList();

            expect(sectionManager.sectionByLine(0)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(1)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(3)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(5)).toBe(sectionList[2]);
            expect(sectionManager.sectionByLine(99999)).toBe(sectionList[3]);
        });

        it('do not new section of image where at non root level & paragraph first child', () => {
            ned.setValue([
                'paragraph',
                '# header1',
                'paragraph',
                'paragraph',
                '* NHN EnterTainment ![nhnent](http://www.nhnent.com)',
                'NHN EnterTainment ![nhnent](http://www.nhnent.com)',
                '## header2',
                'paragraph'
            ].join('\n'));

            sectionManager.makeSectionList();
            const sectionList = sectionManager.getSectionList();

            expect(sectionManager.sectionByLine(0)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(1)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(3)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(4)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(5)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(99999)).toBe(sectionList[2]);
        });

        it('do not create new section of image where at non root level', () => {
            ned.setValue([
                'paragraph',
                '# header1',
                'paragraph',
                'paragraph',
                'asdNHN EnterTainment ![nhnent](http://www.nhnent.com)',
                '* NHN EnterTainment ![nhnent](http://www.nhnent.com)',
                '* [ ] NHN EnterTainment ![nhnent](http://www.nhnent.com)',
                '1. NHN EnterTainment ![nhnent](http://www.nhnent.com)',
                '- NHN EnterTainment ![nhnent](http://www.nhnent.com)',
                '> NHN EnterTainment ![nhnent](http://www.nhnent.com)',
                '>> NHN EnterTainment ![nhnent](http://www.nhnent.com)',
                '```',
                '![nhnent](http://www.nhnent.com)',
                '```',
                '## header2',
                'paragraph'
            ].join('\n'));

            sectionManager.makeSectionList();
            const sectionList = sectionManager.getSectionList();

            expect(sectionManager.sectionByLine(0)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(3)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(4)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(5)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(6)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(7)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(8)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(9)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(10)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(11)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(12)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(13)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(99999)).toBe(sectionList[2]);
        });

        it('should create new image section right after two codeblocks that without line breaks between', () => {
            ned.setValue([
                '``` js',
                'var a = 10;',
                '```',
                '``` js',
                'var b = 20;',
                '```',
                '',
                '![nhnent](http://www.nhnent.com)',
                ''
            ].join('\n'));

            sectionManager.makeSectionList();
            const sectionList = sectionManager.getSectionList();

            expect(sectionManager.sectionByLine(0)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(1)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(7)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(99999)).toBe(sectionList[1]);
        });

        it('do not create new section right after image that line has no content', () => {
            ned.setValue([
                '![nhnent](http://www.nhnent.com)',
                ''
            ].join('\n'));

            sectionManager.makeSectionList();
            const sectionList = sectionManager.getSectionList();

            expect(sectionManager.sectionByLine(0)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(1)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(99999)).toBe(sectionList[0]);
        });

        it('should create new section on sequential image', () => {
            ned.setValue([
                '![nhnent](http://www.nhnent.com)',
                '',
                '![nhnent](http://www.nhnent.com)',
                '',
                '',
                '',
                '![nhnent](http://www.nhnent.com)',
                '',
                '',
                '',
                '![nhnent](http://www.nhnent.com)',
                '',
                '',
                '![nhnent](http://www.nhnent.com)<br>',
                '<br>',
                '![nhnent](http://www.nhnent.com)',
                '',
                '',
                '# heading',
                '',
                ''
            ].join('\n'));

            sectionManager.makeSectionList();
            const sectionList = sectionManager.getSectionList();

            expect(sectionManager.sectionByLine(0)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(1)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(2)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(3)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(4)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(5)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(6)).toBe(sectionList[2]);
            expect(sectionManager.sectionByLine(7)).toBe(sectionList[2]);
            expect(sectionManager.sectionByLine(8)).toBe(sectionList[2]);
            expect(sectionManager.sectionByLine(9)).toBe(sectionList[2]);
            expect(sectionManager.sectionByLine(10)).toBe(sectionList[3]);
            expect(sectionManager.sectionByLine(13)).toBe(sectionList[4]);
            expect(sectionManager.sectionByLine(14)).toBe(sectionList[5]);
            expect(sectionManager.sectionByLine(15)).toBe(sectionList[5]);
            expect(sectionManager.sectionByLine(16)).toBe(sectionList[5]);
            expect(sectionManager.sectionByLine(18)).toBe(sectionList[6]);
            expect(sectionManager.sectionByLine(99999)).toBe(sectionList[6]);
        });
        it('should create new section on spaced image', () => {
            ned.setValue([
                ' ![nhnent](http://www.nhnent.com)',
                '',
                '  ![nhnent](http://www.nhnent.com)',
                ''
            ].join('\n'));

            sectionManager.makeSectionList();
            const sectionList = sectionManager.getSectionList();

            expect(sectionManager.sectionByLine(0)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(1)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(2)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(3)).toBe(sectionList[1]);
            expect(sectionManager.sectionByLine(99999)).toBe(sectionList[1]);
        });
        it('should create new section on non independent inline image', () => {
            ned.setValue([
                'This is ![nhnent](http://www.nhnent.com) official logo.',
                '',
                'And here is too ![nhnent](http://www.nhnent.com).',
                ''
            ].join('\n'));

            sectionManager.makeSectionList();
            const sectionList = sectionManager.getSectionList();

            expect(sectionManager.sectionByLine(0)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(1)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(2)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(3)).toBe(sectionList[0]);
            expect(sectionManager.sectionByLine(99999)).toBe(sectionList[0]);
        });
    });
});
