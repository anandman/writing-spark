// Character/unit memberships from Better Chinese LLC:
// Better Immersion New Edition Character List, pages 1-2, hosted by PGCPS.
// Source: https://www.pgcps.org/globalassets/schools/elementary/paint-branch/docs---paint-branch/better-immersion-chinese-character-list.pdf
// Retrieved 2026-10-15. PDF radical glyphs normalized with Unicode NFKC.
// These are character lists, not complete compound-word lists or school pacing guides.
const BETTER_IMMERSION_LEVELS = {
    2: [
        { unit: 1, characters: '狗努猫牛像' },
        { unit: 2, characters: '亲就难低情' },
        { unit: 3, characters: '您孩该应姨' },
        { unit: 4, characters: '房暖越虽然' },
        { unit: 5, characters: '城乡路树处' },
        { unit: 6, characters: '买卖进常出' },
        { unit: 7, characters: '结冰死田喝' },
        { unit: 8, characters: '林类虫鸟最' },
        { unit: 9, characters: '图园真而且' },
        { unit: 10, characters: '呢画较总数' },
        { unit: 11, characters: '收或回笑第' },
        { unit: 12, characters: '怎谢拿给更活' },
        { unit: 13, characters: '面快条直定着' },
        { unit: 14, characters: '农成运米除店' },
        { unit: 15, characters: '安世界公平法' },
        { unit: 16, characters: '对强风怕根飞' },
        { unit: 17, characters: '身站远先找与' },
        { unit: 18, characters: '改让百千万亿' },
        { unit: 19, characters: '需命旧化慢短' },
        { unit: 20, characters: '规许律新边自' },
        { unit: 21, characters: '当够觉次候讲' },
        { unit: 22, characters: '各庭转州之加' },
        { unit: 23, characters: '寸陆机积倍完' },
        { unit: 24, characters: '题答却识发课' },
        { unit: 25, characters: '材料制造易碎' },
        { unit: 26, characters: '喷睡泪流哭脚' },
        { unit: 27, characters: '防倒失排吹跟' },
    ],
    3: [
        { unit: 1, characters: '丽洲阳其黑瘦非亮' },
        { unit: 2, characters: '石突院把放坐连己' },
        { unit: 3, characters: '张写亚等茶英闻共' },
        { unit: 4, characters: '班香背弯腰体点糖' },
        { unit: 5, characters: '民移于产困代病终' },
        { unit: 6, characters: '相信温勇队战司表' },
        { unit: 7, characters: '论甚至保关注护老' },
        { unit: 8, characters: '希望空省部告诉见' },
        { unit: 9, characters: '感吸靠近入层达象' },
        { unit: 10, characters: '梦待约秃浅愿伤滴' },
        { unit: 11, characters: '神奇师教由闪云红' },
        { unit: 12, characters: '传历庆往别服绿史' },
        { unit: 13, characters: '权逃意换义影响献' },
        { unit: 14, characters: '位资源片接环境原' },
        { unit: 15, characters: '政府华语言育解决' },
        { unit: 16, characters: '通求量经适消存久' },
        { unit: 17, characters: '立干细支品净破坏' },
        { unit: 18, characters: '抽济撑陷使赚无两' },
        { unit: 19, characters: '戴录级纪理助差健康' },
        { unit: 20, characters: '裂父母敢错便乐继续' },
        { unit: 21, characters: '单展科技息复杂沟线' },
        { unit: 22, characters: '打认特全基营养食术' },
        { unit: 23, characters: '筑汉实深漂曾证碰撞' },
        { unit: 24, characters: '德落斗害留夜玩兴祝' },
        { unit: 25, characters: '恐龙灭绝考古已颗灾' },
        { unit: 26, characters: '静型修归播堂角期熟' },
        { unit: 27, characters: '妙习底电输置弱轻再' },
    ],
    4: [
        { unit: 1, characters: '查族裔行本确办祖正' },
        { unit: 2, characters: '脑脏血管眼液凉弄医' },
        { unit: 3, characters: '组趣兄提离幸满志送' },
        { unit: 4, characters: '建野诚杀危险书礼争' },
        { unit: 5, characters: '森场主洋饭仅指系忘' },
        { unit: 6, characters: '游假旁停谈访止判程' },
        { unit: 7, characters: '断寻据墙块拼休始冲' },
        { unit: 8, characters: '震座市灰持元既包桌' },
        { unit: 9, characters: '准备并整介绍吧村余' },
        { unit: 10, characters: '演双般速精克将普具' },
        { unit: 11, characters: '读厅益参获奖周领务' },
        { unit: 12, characters: '洗客态度刚啊叹另束' },
        { unit: 13, characters: '示吉利究惯思架散貌' },
    ],
};

function curriculumUnit(level, unit) {
    return BETTER_IMMERSION_LEVELS[level]?.find(item => item.unit === Number(unit)) || null;
}

function curriculumCoverage(level) {
    const characters = (BETTER_IMMERSION_LEVELS[level] || []).map(unit => unit.characters).join('');
    const missing = [...characters].filter(character => !ideasForText(character).length);
    return { available: [...characters].length - missing.length, total: [...characters].length, missing };
}

function initializeCurriculum() {
    const level = document.getElementById('curriculum-level');
    level.value = '4';
    level.addEventListener('change', updateCurriculumUnits);
    document.getElementById('curriculum-unit').addEventListener('change', renderCurriculumUnit);
    updateCurriculumUnits();
}

function updateCurriculumUnits() {
    const level = document.getElementById('curriculum-level').value;
    const select = document.getElementById('curriculum-unit');
    const previousUnit = select.value;
    select.replaceChildren();
    for (const unit of BETTER_IMMERSION_LEVELS[level] || []) {
        const option = document.createElement('option');
        option.value = String(unit.unit);
        option.innerText = `Unit ${unit.unit}`;
        select.appendChild(option);
    }
    select.value = curriculumUnit(level, previousUnit) ? previousUnit : '1';
    const coverage = curriculumCoverage(level);
    document.getElementById('curriculum-coverage').innerText =
        `Level ${level}: ${coverage.available} of ${coverage.total} listed characters have ideas.`;
    renderCurriculumUnit();
}

function renderCurriculumUnit() {
    const level = document.getElementById('curriculum-level').value;
    const unit = curriculumUnit(level, document.getElementById('curriculum-unit').value);
    const buttons = document.getElementById('curriculum-characters');
    const missing = [];
    buttons.replaceChildren();
    for (const character of unit?.characters || '') {
        if (!ideasForText(character).length) {
            missing.push(character);
            continue;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.innerText = character;
        button.setAttribute('aria-label', `Get an idea for ${character}`);
        button.addEventListener('click', () => chooseCurriculumCharacter(character));
        buttons.appendChild(button);
    }
    const missingDisplay = document.getElementById('curriculum-missing');
    missingDisplay.hidden = missing.length === 0;
    missingDisplay.innerText = missing.length ? `Ideas still needed for: ${missing.join(' ')}` : '';
    const total = [...(unit?.characters || '')].length;
    const available = total - missing.length;
    document.getElementById('curriculum-unit-status').innerText =
        `${available} of ${total} characters in this unit have ideas. ` +
        (available ? 'Tap a character below to get one.' : 'Try another unit, or type a character or word above.');
}

function chooseCurriculumCharacter(character) {
    if (currentMode !== 'chinese' || characterComposing || [...character].length !== 1 || !ideasForText(character).length) return;
    document.getElementById('character-input').value = character;
    getSpark();
}
