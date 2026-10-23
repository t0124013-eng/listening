/* =========================================================
   リスニング ラボ：問題データ
   ---------------------------------------------------------
   1セット ＝ Part A（短文・2回読み）3問
             + Part B（対話・1回読み）2問
             + Part C（講義・1回読み）設問3つ
   ・lines の話者：'M'＝男性の声、'W'＝女性の声
   ・ans は正解の番号（0＝1番目の選択肢）
   ・vocab は [語句, 意味, 本文の例文]。例文はカードの裏に表示されます
   ・セットを増やすときは、この配列の最後に同じ形でコピーして書き足す
   ========================================================= */
window.LISTENING_SETS = [

/* ---------------- Set 1 ---------------- */
{
  id: 'L01', title: '都市はなぜ暑いのか', theme: '環境・都市',
  items: [
    { part: 'A', lines: [['M', "Had I known the museum would be closed on Mondays, I wouldn't have come all the way here today."]],
      qs: [{ opts: [
        'The speaker knew the museum would be closed.',
        'The speaker will visit the museum next Monday.',
        'The speaker came to the museum on a day it was closed.',
        'The speaker decided not to go to the museum.'],
        ans: 2,
        exp: '「Had I known 〜」は if I had known の倒置で、仮定法過去完了。「知っていたら来なかった」＝実際は知らずに来てしまった、ということ。' }] },
    { part: 'A', lines: [['W', 'Hardly anyone signed up for the workshop at first, but by Friday we had to turn people away.']],
      qs: [{ opts: [
        'The workshop ended up with more applicants than places.',
        'Few people were interested in the workshop throughout.',
        'The workshop was cancelled on Friday.',
        'People were asked to leave the workshop early.'],
        ans: 0,
        exp: '「turn people away」は「（満員で）断る」。最初はほとんど申し込みがなかったが、金曜には定員を超えた、という流れ。' }] },
    { part: 'A', lines: [['M', "The report isn't due until next Thursday, but I'd rather get it off my plate before the exams start on Monday."]],
      qs: [{ opts: [
        'The report is due on Monday.',
        'The speaker plans to finish the report before Monday.',
        'The speaker will hand in the report after the exams.',
        'The speaker has already finished the report.'],
        ans: 1,
        exp: '「get it off my plate」は「片づける・済ませる」。締切は木曜だが、月曜の試験前に終わらせたいと言っている。' }] },
    { part: 'B', situation: '2人の大学生が、来学期のゼミについて話しています。',
      lines: [
        ['W', 'Have you decided which seminar to take next term?'],
        ['M', "I'm torn. Professor Ito's seminar on media studies sounds fascinating, but it meets at eight in the morning."],
        ['W', "Isn't that the one where you get to make a short documentary?"],
        ['M', "Exactly. That's what makes it hard to give up. The other option is the economics seminar on Thursday afternoons. It fits my schedule perfectly, but the topic doesn't excite me much."],
        ['W', "Well, you've always said you want to work in broadcasting."],
        ['M', "True. I suppose an early start is a small price to pay. I'll just have to go to bed earlier."]],
      qs: [{ q: 'What will the man most likely do?', opts: [
        'Take the economics seminar because of its schedule.',
        'Ask Professor Ito to change the time of the seminar.',
        'Take both seminars next term.',
        'Take the media studies seminar despite the early start.'],
        ans: 3,
        exp: '最後の「an early start is a small price to pay（朝が早いのは小さな代償だ）」「早く寝るしかない」から、朝8時のメディア論ゼミを選ぶと分かる。' }] },
    { part: 'B', situation: '部活動の2人が、文化祭で行った焼き菓子の販売について話しています。',
      lines: [
        ['M', 'The bake sale raised less than we hoped. Maybe we should drop it next year.'],
        ['W', "I'm not sure that's the lesson. Sales were great in the first hour. We simply ran out of goods by eleven."],
        ['M', "So you're saying demand wasn't the problem."],
        ['W', "Right. If we'd baked twice as much, we probably could have doubled the total."],
        ['M', 'But that means twice as many volunteers in the kitchen the night before.'],
        ['W', "Then let's recruit first-year students early, instead of at the last minute."]],
      qs: [{ q: "What is the woman's main point?", opts: [
        'The bake sale should be cancelled next year.',
        'The bake sale needs more preparation, not less.',
        'The bake sale failed because the prices were too high.',
        'First-year students should run the event alone.'],
        ans: 1,
        exp: '女性は「需要はあった、11時に売り切れただけ」と述べ、量を増やし、人手を早めに集めようと提案している。やめるのではなく準備を増やすべきという主張。' }] },
    { part: 'C', situation: '大学の授業で、都市の気温についての講義を聞いています。',
      lines: [
        ['W', "Today I'd like to talk about why cities are often warmer than the countryside around them, a phenomenon known as the urban heat island."],
        ['W', 'On a summer night, the center of a large city can be several degrees warmer than nearby farmland.'],
        ['W', 'There are three main reasons for this.'],
        ['W', 'First, materials like concrete and asphalt absorb heat during the day and release it slowly after sunset, so the city cannot cool down at night.'],
        ['W', 'Second, cities have far fewer trees and plants. Plants cool their surroundings by releasing water vapor through their leaves, a process that works much like sweating does for our bodies.'],
        ['W', 'Third, human activity itself produces heat. Air conditioners, cars, and factories all pump warm air into the streets.'],
        ['W', 'Ironically, the hotter the city becomes, the more people use air conditioners, which makes the problem even worse.'],
        ['W', 'So what can be done? Many cities are experimenting with green roofs, which are rooftops covered with plants.'],
        ['W', 'Others are painting roofs and roads in light colors that reflect sunlight instead of absorbing it. In one study, light-colored pavement lowered surface temperatures by more than ten degrees.'],
        ['W', 'However, these solutions are not perfect. Reflective surfaces can bounce heat onto nearby buildings and pedestrians, and green roofs require regular maintenance and water.'],
        ['W', 'Researchers increasingly argue that no single measure is enough. What matters is combining several approaches, and planning them at the level of the whole neighborhood rather than building by building.']],
      qs: [
        { q: 'According to the lecture, why are cities unable to cool down at night?', opts: [
          'Plants release warm water vapor after sunset.',
          'Building materials release heat they stored during the day.',
          'Factories operate mainly at night.',
          'Clouds over cities trap the heat.'],
          ans: 1,
          exp: '1つ目の理由。コンクリートやアスファルトが日中に熱を吸収し、日没後にゆっくり放出するため夜に冷えない。' },
        { q: 'What does the speaker point out about air conditioners?', opts: [
          'They are the most important cause of the heat island.',
          'They should be banned in city centers.',
          'Their use creates a cycle that makes the heat worse.',
          'They are less common in cities than in rural areas.'],
          ans: 2,
          exp: '「Ironically, the hotter …, the more people use air conditioners」＝暑くなるほど冷房を使い、さらに暑くなる悪循環。' },
        { q: "Which statement best reflects the speaker's conclusion?", opts: [
          'Green roofs are the best single solution.',
          'Reflective surfaces should be avoided completely.',
          'Each building owner should choose one solution.',
          'Several measures should be combined and planned for whole areas.'],
          ans: 3,
          exp: '最後の文。単独の対策では不十分で、複数を組み合わせ、建物単位ではなく地域全体で計画することが重要。' }] }
  ],
  vocab: [
    ['phenomenon', '現象', 'Today I\'d like to talk about why cities are often warmer than the countryside around them, a phenomenon known as the urban heat island.'],
    ['absorb', '吸収する', 'First, materials like concrete and asphalt absorb heat during the day and release it slowly after sunset, so the city cannot cool down at night.'],
    ['release', '放出する', 'First, materials like concrete and asphalt absorb heat during the day and release it slowly after sunset, so the city cannot cool down at night.'],
    ['water vapor', '水蒸気', 'Plants cool their surroundings by releasing water vapor through their leaves, a process that works much like sweating does for our bodies.'],
    ['ironically', '皮肉なことに', 'Ironically, the hotter the city becomes, the more people use air conditioners, which makes the problem even worse.'],
    ['reflect', '反射する', 'Others are painting roofs and roads in light colors that reflect sunlight instead of absorbing it.'],
    ['pavement', '舗装（道路）', 'In one study, light-colored pavement lowered surface temperatures by more than ten degrees.'],
    ['pedestrian', '歩行者', 'Reflective surfaces can bounce heat onto nearby buildings and pedestrians, and green roofs require regular maintenance and water.'],
    ['maintenance', '維持管理', 'Reflective surfaces can bounce heat onto nearby buildings and pedestrians, and green roofs require regular maintenance and water.'],
    ['turn ~ away', '〜を（満員で）断る', 'Hardly anyone signed up for the workshop at first, but by Friday we had to turn people away.'],
    ['get ~ off one\'s plate', '〜を片づける', 'The report isn\'t due until next Thursday, but I\'d rather get it off my plate before the exams start on Monday.'],
    ['a small price to pay', '小さな代償', 'I suppose an early start is a small price to pay.']
  ]
},

/* ---------------- Set 2 ---------------- */
{
  id: 'L02', title: '睡眠と記憶', theme: '脳科学・学習',
  items: [
    { part: 'A', lines: [['W', "I'd have lent you my notes if you'd asked, but it's too late now. I threw them away after the exam."]],
      qs: [{ opts: [
        'The speaker still has the notes.',
        'The speaker no longer has the notes.',
        'The speaker lent the notes to someone else.',
        'The listener asked for the notes before the exam.'],
        ans: 1,
        exp: '仮定法過去完了「頼まれていたら貸したのに」＝実際は頼まれなかった。さらに試験後に捨てたので、もう手元にない。' }] },
    { part: 'A', lines: [['M', 'Not until I started living alone did I realize how much my parents had done for me.']],
      qs: [{ opts: [
        "The speaker's parents live alone.",
        'The speaker has never lived with his parents.',
        "The speaker's parents told him how much they had done.",
        "The speaker realized his parents' efforts after moving out."],
        ans: 3,
        exp: '「Not until A did I 〜」＝「Aして初めて〜した」。一人暮らしを始めてから親のありがたさに気づいた。' }] },
    { part: 'A', lines: [['W', "The bus is usually packed at this hour, so we might as well walk. It's only fifteen minutes."]],
      qs: [{ opts: [
        'The speaker suggests walking instead of taking the bus.',
        'The bus will arrive in fifteen minutes.',
        'The speaker prefers to wait for an empty bus.',
        'Walking takes longer than the speaker expected.'],
        ans: 0,
        exp: '「might as well 〜」＝「〜したほうがいい（ましだ）」。バスは混んでいるので歩こうという提案。15分は歩く時間。' }] },
    { part: 'B', situation: '2人の高校生が、留学先での滞在方法について話しています。',
      lines: [
        ['W', 'So, for your exchange program, did you choose the dormitory or a host family?'],
        ['M', "I applied for the dorm at first. It's right on campus, and I'd have more freedom."],
        ['W', '"At first"? Did you change your mind?'],
        ['M', 'Yeah. My teacher pointed out that in the dorm, most exchange students end up speaking their own language together.'],
        ['W', "That's true. My cousin said the same thing."],
        ['M', "With a host family, I'd have to use English at breakfast, at dinner, all the time. The commute is forty minutes, though."],
        ['W', 'Sounds like a fair trade to me.']],
      qs: [{ q: 'Why did the man change his choice?', opts: [
        'The dormitory was too far from campus.',
        'His cousin recommended a host family.',
        'He wanted more chances to use English.',
        'The dormitory was already full.'],
        ans: 2,
        exp: '寮では留学生同士が母語で話しがちだと先生に指摘され、英語を使う機会が多いホストファミリーにした。いとこは女性のいとこなので注意。' }] },
    { part: 'B', situation: '2人の学生が、タブレットでの読書について話しています。',
      lines: [
        ['M', "I've switched to reading all my textbooks on my tablet. It's so much lighter."],
        ['W', 'Convenient, sure. But do you remember what you read as well as you did with paper?'],
        ['M', 'Hmm, now that you mention it, I sometimes have to reread pages.'],
        ['W', 'Some studies suggest people skim more on screens. With paper, you can sense where you are in the book, and that seems to help memory.'],
        ['M', 'So should I go back to paper?'],
        ['W', 'Not necessarily. Maybe use the tablet for quick reference, and print out the chapters you really need to study.']],
      qs: [{ q: 'What does the woman suggest?', opts: [
        'Choosing between paper and screen depending on the purpose.',
        'Stopping using the tablet entirely.',
        'Reading each chapter twice on the tablet.',
        'Buying paper copies of all the textbooks.'],
        ans: 0,
        exp: '「Not necessarily」で紙に完全に戻すことは否定し、調べものはタブレット、しっかり学ぶ章は印刷と、目的で使い分けるよう勧めている。' }] },
    { part: 'C', situation: '高校の特別講義で、睡眠と記憶についての話を聞いています。',
      lines: [
        ['M', 'Many students believe that staying up late to study is a sign of hard work. Research on sleep, however, suggests that this habit may actually undermine learning.'],
        ['M', 'When we learn something new, the information is first stored in a part of the brain called the hippocampus, which works like a temporary notebook.'],
        ['M', "During deep sleep, the brain replays the day's experiences and transfers important information to the cortex, where it can be kept for the long term."],
        ['M', 'In other words, sleep is not simply a time when the brain is resting. It is when much of the work of remembering actually happens.'],
        ['M', 'In one experiment, two groups of participants learned a list of word pairs. One group was tested after a night\'s sleep, and the other after staying awake for the same number of hours during the day.'],
        ['M', 'The group that had slept recalled significantly more words. Interestingly, the advantage was even larger for information that participants had been told they would need later.'],
        ['M', 'This suggests that the sleeping brain is selective. It seems to prioritize what we consider important.'],
        ['M', 'Sleep also appears to help us find hidden patterns. In another study, people who slept after practicing a math task were more than twice as likely to discover a shortcut as those who did not.'],
        ['M', "So, if you have an exam tomorrow, a final review followed by a full night's sleep may serve you better than an all-nighter."]],
      qs: [
        { q: 'According to the lecture, what is the role of the hippocampus?', opts: [
          'It keeps memories permanently.',
          'It controls the depth of sleep.',
          'It decides which memories to forget.',
          'It stores new information temporarily.'],
          ans: 3,
          exp: '海馬は「temporary notebook（一時的なノート）」のように新しい情報をまず保存する。長期保存されるのは大脳皮質（cortex）。' },
        { q: 'What was the result of the word-pair experiment?', opts: [
          'Those who stayed awake remembered important words better.',
          'Those who slept remembered more, especially information marked as important.',
          'Both groups recalled about the same number of words.',
          'Sleep helped only with words that were not important.'],
          ans: 1,
          exp: '眠ったグループの方が多く思い出し、「後で必要になる」と言われた情報ではその差がさらに大きかった。' },
        { q: 'What can be inferred from the lecture?', opts: [
          'Sleeping after studying can help both memory and problem-solving.',
          'Students should study only in the morning.',
          'Deep sleep is a period when the brain is inactive.',
          'Discovering shortcuts requires staying awake.'],
          ans: 0,
          exp: '記憶の定着（単語の実験）に加え、近道の発見（数学の実験）にも睡眠が役立つ。脳が休んでいるだけではない点にも注意。' }] }
  ],
  vocab: [
    ['undermine', '損なう', 'Research on sleep, however, suggests that this habit may actually undermine learning.'],
    ['temporary', '一時的な', 'When we learn something new, the information is first stored in a part of the brain called the hippocampus, which works like a temporary notebook.'],
    ['transfer', '移す', 'During deep sleep, the brain replays the day\'s experiences and transfers important information to the cortex, where it can be kept for the long term.'],
    ['participant', '参加者', 'In one experiment, two groups of participants learned a list of word pairs.'],
    ['recall', '思い出す', 'The group that had slept recalled significantly more words.'],
    ['significantly', '著しく', 'The group that had slept recalled significantly more words.'],
    ['selective', '選択的な', 'This suggests that the sleeping brain is selective.'],
    ['prioritize', '優先する', 'It seems to prioritize what we consider important.'],
    ['all-nighter', '徹夜', 'So, if you have an exam tomorrow, a final review followed by a full night\'s sleep may serve you better than an all-nighter.'],
    ['might as well', '〜したほうがいい', 'The bus is usually packed at this hour, so we might as well walk.'],
    ['skim', 'ざっと読む', 'Some studies suggest people skim more on screens.'],
    ['commute', '通学・通勤', 'The commute is forty minutes, though.']
  ]
},

/* ---------------- Set 3 ---------------- */
{
  id: 'L03', title: '消えゆく言語', theme: '言語・文化',
  items: [
    { part: 'A', lines: [['M', "I can't believe it's already sold out. I should have booked the tickets when you first mentioned the concert."]],
      qs: [{ opts: [
        'The speaker bought tickets when the concert was announced.',
        'The listener forgot to mention the concert.',
        'The speaker regrets not buying tickets earlier.',
        'The concert has been cancelled.'],
        ans: 2,
        exp: '「should have + 過去分詞」＝「〜すべきだったのに（しなかった）」という後悔。' }] },
    { part: 'A', lines: [['W', "Of all the cities I visited, it's the smallest one that I'd most like to go back to."]],
      qs: [{ opts: [
        'The speaker wants to visit a large city again.',
        'The speaker has not been to any small cities.',
        'The speaker would like to live in a small city.',
        'The speaker liked the smallest city best.'],
        ans: 3,
        exp: '「it is 〜 that …」の強調構文。一番また行きたいのは一番小さな都市。「住みたい」とまでは言っていない。' }] },
    { part: 'A', lines: [['M', "You don't need to bring anything to the party. Just yourself. Well, maybe a jacket. It gets chilly after dark."]],
      qs: [{ opts: [
        'The speaker suggests bringing something warm to wear.',
        'The listener should bring some food.',
        'The party will be held indoors.',
        'The party will end before dark.'],
        ans: 0,
        exp: '「何も持ってこなくていい」と言った後に「Well, maybe a jacket」と付け足している。最後の付け足しが聞き取りのポイント。' }] },
    { part: 'B', situation: '同じグループの2人が、発表の準備について話しています。',
      lines: [
        ['W', 'Our presentation is on Friday. Shall we split the slides evenly?'],
        ['M', "I'd rather divide it by strengths. You're the best speaker in our group, so maybe you should present the conclusion."],
        ['W', 'Fine, but then someone else has to analyze the survey data.'],
        ['M', "That'll be me. I'm comfortable with spreadsheets."],
        ['W', 'And Kenta?'],
        ['M', "He's good at design. Let's ask him to make the slides look consistent."],
        ['W', "OK, but let's all rehearse together on Thursday so the parts connect smoothly."]],
      qs: [{ q: 'How will the group divide the work?', opts: [
        'Each member will make the same number of slides.',
        "Roles will be assigned according to each person's strengths.",
        'The woman will analyze the data and present the conclusion.',
        'Kenta will present the conclusion.'],
        ans: 1,
        exp: '男性は「by strengths（得意で分ける）」と提案。女性＝結論の発表、男性＝データ分析、ケンタ＝デザイン。' }] },
    { part: 'B', situation: '2人の高校生が、学校のスマートフォンのルールについて話しています。',
      lines: [
        ['M', 'I heard our school might ban smartphones during the day. I think it\'s a great idea.'],
        ['W', 'Really? I use mine to look up words in class all the time.'],
        ['M', 'But how often do people end up on social media instead?'],
        ['W', 'Fair point. Still, a complete ban seems extreme. What about collecting phones only during tests, and letting teachers decide for regular lessons?'],
        ['M', 'That might be harder to enforce, though.'],
        ['W', 'Maybe, but it treats us as people who can make responsible choices.']],
      qs: [{ q: "What is the woman's position?", opts: [
        'She fully supports the ban.',
        'She thinks phones should be allowed everywhere without rules.',
        'She thinks teachers should never allow phones in class.',
        'She prefers a more flexible policy than a total ban.'],
        ans: 3,
        exp: '「Fair point」で一部認めつつ、全面禁止は極端だとして、テスト中のみ回収・授業は先生の判断という柔軟な案を出している。' }] },
    { part: 'C', situation: '大学の授業で、世界の言語についての講義を聞いています。',
      lines: [
        ['W', 'Of the roughly seven thousand languages spoken in the world today, linguists estimate that nearly half are endangered.'],
        ['W', 'Many of them have fewer than a thousand speakers, and some are known by only a handful of elderly people.'],
        ['W', 'When the last speaker of a language dies, something more than a list of words disappears. Languages carry knowledge that is often found nowhere else.'],
        ['W', 'For example, some indigenous languages in the Pacific contain detailed names for fish species and ocean currents that scientists have only recently begun to document.'],
        ['W', 'Why do languages die? The most common reason is not that speakers are forced to stop, although this has happened in history.'],
        ['W', 'Rather, parents often choose to raise their children in a more widely spoken language, because they believe it will give them better opportunities in education and employment.'],
        ['W', 'Within two or three generations, the original language may no longer be passed on.'],
        ['W', 'Can this trend be reversed? There are encouraging cases. Hebrew, which for centuries was used mainly in religious texts, became the everyday language of millions of people in the twentieth century.'],
        ['W', 'More recently, the Maori community in New Zealand created preschools where young children are surrounded by the language, and the number of young speakers has grown.'],
        ['W', 'These examples show that revival is possible. But they also show what it requires: not just recordings and dictionaries, but communities that decide to use the language in daily life.']],
      qs: [
        { q: 'According to the lecture, what is the most common reason languages disappear?', opts: [
          "Parents choose another language for their children's future.",
          'Governments forbid people from speaking them.',
          'Their speakers move to other countries.',
          'They do not have written dictionaries.'],
          ans: 0,
          exp: '「not that 〜. Rather, …」の構文に注目。強制されるからではなく、親が子の教育・就職のために広く話される言語で育てるから。' },
        { q: 'Why does the speaker mention names for fish species and ocean currents?', opts: [
          'To explain why indigenous languages are hard to learn.',
          'To show that languages can contain unique knowledge.',
          'To argue that scientists should learn indigenous languages.',
          'To give an example of a language that has been revived.'],
          ans: 1,
          exp: '直前の「Languages carry knowledge that is often found nowhere else」の具体例。例は主張を支えるために出てくる。' },
        { q: 'What does the speaker suggest is essential for reviving a language?', opts: [
          'Recording all of its remaining speakers.',
          'Using it mainly in religious texts.',
          'People actually using it in their daily lives.',
          'Teaching it only to elderly people.'],
          ans: 2,
          exp: '最後の「not just recordings and dictionaries, but communities that decide to use the language in daily life」。録音や辞書だけでは足りない。' }] }
  ],
  vocab: [
    ['linguist', '言語学者', 'Of the roughly seven thousand languages spoken in the world today, linguists estimate that nearly half are endangered.'],
    ['endangered', '絶滅の危機にある', 'Of the roughly seven thousand languages spoken in the world today, linguists estimate that nearly half are endangered.'],
    ['a handful of', 'ほんの少しの', 'Many of them have fewer than a thousand speakers, and some are known by only a handful of elderly people.'],
    ['indigenous', '先住の・土着の', 'For example, some indigenous languages in the Pacific contain detailed names for fish species and ocean currents that scientists have only recently begun to document.'],
    ['document', '記録する', 'For example, some indigenous languages in the Pacific contain detailed names for fish species and ocean currents that scientists have only recently begun to document.'],
    ['generation', '世代', 'Within two or three generations, the original language may no longer be passed on.'],
    ['reverse', '逆転させる', 'Can this trend be reversed?'],
    ['revival', '復活', 'These examples show that revival is possible.'],
    ['enforce', '（規則を）守らせる', 'That might be harder to enforce, though.'],
    ['consistent', '統一された', 'Let\'s ask him to make the slides look consistent.'],
    ['chilly', '肌寒い', 'It gets chilly after dark.'],
    ['sold out', '売り切れの', 'I can\'t believe it\'s already sold out.']
  ]
},

/* ---------------- Set 4 ---------------- */
{
  id: 'L04', title: '選択をデザインする', theme: '行動経済学',
  items: [
    { part: 'A', lines: [['W', "It's not that I don't want to help. It's just that I promised Mika I'd finish her poster first."]],
      qs: [{ opts: [
        "The speaker doesn't want to help.",
        'Mika will help the listener.',
        'The speaker will help after finishing another task.',
        'The speaker has already finished the poster.'],
        ans: 2,
        exp: '「It\'s not that 〜. It\'s just that …」＝「〜というわけではなく、ただ…なだけ」。「first（先に）」から、ポスターの後で手伝うと分かる。' }] },
    { part: 'A', lines: [['M', 'The more I practice this piece, the less confident I feel about the ending.']],
      qs: [{ opts: [
        'The speaker is unsure about the final part.',
        'The speaker feels more confident with practice.',
        'The speaker has stopped practicing.',
        'The speaker finds the beginning difficult.'],
        ans: 0,
        exp: '「the 比較級 〜, the 比較級 …」。練習するほど、終わりの部分に自信がなくなる。less を聞き逃さないこと。' }] },
    { part: 'A', lines: [['W', 'Whoever left the window open last night, please don\'t do it again. The papers on my desk were soaked.']],
      qs: [{ opts: [
        'The speaker left the window open.',
        'The speaker knows who left the window open.',
        'The papers were blown off the desk.',
        "Rain came in and wet the speaker's papers."],
        ans: 3,
        exp: '「Whoever 〜」＝「誰であれ」なので、誰が開けたかは分かっていない。「soaked（びしょぬれ）」から雨が入ったと推測できる。' }] },
    { part: 'B', situation: '2人の高校生が、アルバイト選びについて話しています。',
      lines: [
        ['M', "I got two offers for part-time jobs. One's at a cafe near the station, and the other's tutoring a junior high school student."],
        ['W', 'Which pays more?'],
        ['M', "The cafe, by about two hundred yen an hour. But the tutoring is only twice a week, so I'd have more time to study."],
        ['W', "You're applying to medical school, right? Time seems more valuable to you than money right now."],
        ['M', "That's what I was thinking. Plus, explaining things to someone else might help me review the basics."],
        ['W', 'Then the answer seems clear.']],
      qs: [{ q: 'Which job will the man most likely choose, and why?', opts: [
        'The cafe, because it pays more per hour.',
        'The cafe, because it is near the station.',
        'Tutoring, because the student is preparing for medical school.',
        'Tutoring, because it leaves more time and helps his own studies.'],
        ans: 3,
        exp: '医学部志望の男性にとっては時間の方が大切で、教えることが基礎の復習にもなる。医学部を目指すのは中学生ではなく男性本人。' }] },
    { part: 'B', situation: '文化祭の実行委員の2人が、飲み物の販売方法について話しています。',
      lines: [
        ['W', "For the school festival, I'm proposing we stop selling drinks in plastic bottles."],
        ['M', "People will complain. It's hot, and they'll want something to drink."],
        ['W', "We'd still sell drinks, just from large containers. Visitors could buy a reusable cup for a hundred yen, or bring their own."],
        ['M', "Won't that slow down the line?"],
        ['W', 'A little, at first. But the drama club tried it last year, and after the first hour it was just as fast.'],
        ['M', "OK. If there's evidence it works, I'm willing to give it a try."]],
      qs: [{ q: 'What made the man agree with the proposal?', opts: [
        'The woman promised the drinks would be cheaper.',
        'Another club had already tried the idea successfully.',
        'Visitors had complained about plastic bottles.',
        'The festival will be held in cooler weather.'],
        ans: 1,
        exp: '演劇部が昨年試してうまくいったという「evidence（根拠）」を聞いて賛成した。' }] },
    { part: 'C', situation: '経済学の授業で、「ナッジ」についての講義を聞いています。',
      lines: [
        ['M', 'Imagine two countries with very similar cultures. In one, about ninety percent of people agree to donate their organs after death. In the other, the figure is closer to fifteen percent.'],
        ['M', 'What explains such a difference? Surprisingly, it is not values or religion, but the design of a form.'],
        ['M', 'In the first country, people are automatically registered as donors unless they choose to opt out. In the second, they must actively opt in.'],
        ['M', 'Because most people never change the default option, the default largely decides the outcome.'],
        ['M', "Economists call this kind of design a nudge: a change in the way choices are presented that influences behavior without forbidding any option or changing financial incentives."],
        ['M', 'Nudges are now widely used. Some companies automatically enroll new employees in retirement savings plans, which has dramatically increased participation.'],
        ['M', 'Cafeterias that place fruit at eye level and desserts further away find that people choose healthier food.'],
        ['M', 'Supporters argue that nudges are cheap and respect freedom, since anyone can still choose differently.'],
        ['M', 'Critics, however, raise two concerns. First, nudges work best when people are not paying attention, which some see as a form of manipulation.'],
        ['M', "Second, the person who designs the default must decide what is good for others, and that judgment may not reflect everyone's interests."],
        ['M', 'For this reason, many researchers argue that nudges should be transparent. People should be able to find out easily who designed the choice, and why.']],
      qs: [
        { q: 'According to the lecture, what mainly causes the difference in donation rates?', opts: [
          'Differences in religious beliefs.',
          'Whether people must choose to join or choose to leave.',
          'Financial rewards for donors.',
          'The amount of information on the form.'],
          ans: 1,
          exp: 'opt out（不参加を選ぶ）方式か opt in（参加を選ぶ）方式か、つまり初期設定（default）の違い。価値観や宗教ではないと明言している。' },
        { q: 'Which is an example of a nudge described in the lecture?', opts: [
          'Taxing sugary drinks.',
          'Banning desserts in cafeterias.',
          'Placing fruit where people can see it easily.',
          'Paying employees to save money.'],
          ans: 2,
          exp: 'ナッジの定義は「選択肢を禁止せず、金銭的動機も変えない」。課税・禁止・お金で釣るのはナッジに当たらない。' },
        { q: 'What do many researchers recommend, according to the speaker?', opts: [
          'Making it clear who designed a choice and for what purpose.',
          'Replacing nudges with financial incentives.',
          'Using nudges only when people are not paying attention.',
          'Letting companies decide what is good for their employees.'],
          ans: 0,
          exp: '最後の「nudges should be transparent」。誰がなぜその選択肢を設計したのか、簡単に分かるようにすべき。' }] }
  ],
  vocab: [
    ['donate', '寄付する・提供する', 'In one, about ninety percent of people agree to donate their organs after death.'],
    ['opt out', '不参加を選ぶ', 'In the first country, people are automatically registered as donors unless they choose to opt out.'],
    ['opt in', '参加を選ぶ', 'In the second, they must actively opt in.'],
    ['default', '初期設定', 'Because most people never change the default option, the default largely decides the outcome.'],
    ['incentive', '動機づけ・誘因', 'Economists call this kind of design a nudge: a change in the way choices are presented that influences behavior without forbidding any option or changing financial incentives.'],
    ['enroll', '登録する', 'Some companies automatically enroll new employees in retirement savings plans, which has dramatically increased participation.'],
    ['participation', '参加', 'Some companies automatically enroll new employees in retirement savings plans, which has dramatically increased participation.'],
    ['manipulation', '操作・ごまかし', 'First, nudges work best when people are not paying attention, which some see as a form of manipulation.'],
    ['transparent', '透明な・分かりやすい', 'For this reason, many researchers argue that nudges should be transparent.'],
    ['soaked', 'びしょぬれの', 'The papers on my desk were soaked.'],
    ['reusable', '再利用できる', 'Visitors could buy a reusable cup for a hundred yen, or bring their own.'],
    ['evidence', '根拠・証拠', 'If there\'s evidence it works, I\'m willing to give it a try.']
  ]
},

/* ---------------- Set 5 ---------------- */
{
  id: 'L05', title: '忘却曲線と勉強法', theme: '心理学・学習',
  items: [
    { part: 'A', lines: [['M', "I wouldn't call the movie bad, exactly. It just wasn't worth the two-hour wait to get in."]],
      qs: [{ opts: [
        'The speaker thought the movie was terrible.',
        'The movie lasted only two hours.',
        'The speaker did not see the movie.',
        'The speaker felt the movie did not justify the long wait.'],
        ans: 3,
        exp: '「悪いとまでは言わないが、2時間並ぶほどの価値はなかった」。two-hour は映画の長さではなく待ち時間。' }] },
    { part: 'A', lines: [['W', "Since the library extended its hours, I've been studying there instead of at the cafe."]],
      qs: [{ opts: [
        'The library now closes earlier than before.',
        'The speaker changed where she studies because the library is open longer.',
        'The speaker studies at the cafe more often now.',
        'The cafe has stopped allowing students to study.'],
        ans: 1,
        exp: '「extended its hours」＝開館時間を延ばした。それ以来カフェではなく図書館で勉強している。' }] },
    { part: 'A', lines: [['M', 'Twenty people were invited, but only half showed up, and three of them left early.']],
      qs: [{ opts: [
        'Seven people stayed until the end.',
        'Ten people left early.',
        'Thirteen people came.',
        'Twenty people attended.'],
        ans: 0,
        exp: '招待20人 → 来たのは半分の10人 → そのうち3人が早退 → 最後までいたのは7人。数字は聞きながら計算する。' }] },
    { part: 'B', situation: '2人の高校生が、英語スピーチコンテストについて話しています。',
      lines: [
        ['W', 'The English speech contest application closes tomorrow. Are you entering?'],
        ['M', "I wrote a draft, but I'm not sure. The topic I chose might be too personal."],
        ['W', "What's it about?"],
        ['M', 'Moving to Japan when I was ten, and not understanding anything at school.'],
        ['W', 'That sounds powerful. Judges usually remember stories, not statistics.'],
        ['M', "Maybe. But I'd have to talk about some embarrassing moments."],
        ['W', "That's exactly what makes a speech real. Why not show the draft to Ms. Brown today, and decide after hearing her opinion?"],
        ['M', "That's reasonable. I'll go to the teachers' room at lunch."]],
      qs: [{ q: 'What will the man do next?', opts: [
        'Submit the application immediately.',
        'Change the topic of his speech.',
        'Get feedback from a teacher before deciding.',
        'Withdraw from the contest.'],
        ans: 2,
        exp: '女性の「Why not show the draft to Ms. Brown …」に「That\'s reasonable」と同意し、昼休みに職員室へ行く。まだ申し込むとは決めていない。' }] },
    { part: 'B', situation: '2人の高校生が、授業動画の見方について話しています。',
      lines: [
        ['M', "I've started watching recorded lectures at double speed. I can get through twice as much material."],
        ['W', 'Can you really follow at that speed?'],
        ['M', "Mostly. When it's something I already know, it's fine."],
        ['W', "Then that's the key, isn't it? It works for review, but for new topics you might miss important points."],
        ['M', 'So you think I should slow down for new material?'],
        ['W', "Yes, and pause to take notes. Saving time doesn't help if you have to watch it all again later."]],
      qs: [{ q: "What is the woman's opinion?", opts: [
        'Recorded lectures should never be sped up.',
        'Taking notes is unnecessary when watching lectures.',
        'Watching at double speed helps understanding of new topics.',
        'Speeding up is fine for familiar content but not for new content.'],
        ans: 3,
        exp: '「It works for review, but for new topics …」。復習なら倍速でもよいが、新しい内容はゆっくり、メモを取りながら見るべき。' }] },
    { part: 'C', situation: '心理学の授業で、記憶と学習方法についての講義を聞いています。',
      lines: [
        ['W', 'In the eighteen eighties, the German psychologist Hermann Ebbinghaus conducted an unusual experiment on himself.'],
        ['W', 'He memorized lists of meaningless syllables, and then tested how much he could remember after different periods of time.'],
        ['W', 'He found that forgetting happens fastest right after learning. A large portion of the material was lost within the first day, after which the decline slowed down. This pattern is now known as the forgetting curve.'],
        ['W', 'But Ebbinghaus also discovered something more hopeful. Each time he reviewed the material, he forgot it more slowly than before.'],
        ['W', 'In other words, reviewing does not simply restore memory. It makes memory more durable.'],
        ['W', 'This led to what psychologists call the spacing effect. If you have, say, sixty minutes to study a set of vocabulary, spreading that time over three separate days produces far better long-term retention than spending all sixty minutes in one session.'],
        ['W', 'Modern research has added a second key finding, called the testing effect. Simply rereading notes feels productive, but it is a relatively weak way to learn.'],
        ['W', 'Trying to recall information, for example by covering the answers and testing yourself, strengthens memory much more, even when you fail to recall the answer. The struggle itself seems to be part of the learning process.'],
        ['W', 'Put these two ideas together, and you have a powerful strategy: test yourself, and spread your practice over time.'],
        ['W', 'The irony is that this approach often feels harder and less efficient than cramming, which is precisely why many students do not use it.']],
      qs: [
        { q: 'What did Ebbinghaus find about forgetting?', opts: [
          'It happens at a steady rate over time.',
          'It is fastest soon after learning and then slows down.',
          'It begins only after several days.',
          'It is slower for meaningless material.'],
          ans: 1,
          exp: '学習直後に最も速く忘れ、1日目以降は忘れるペースがゆるやかになる＝忘却曲線。' },
        { q: 'According to the lecture, which study plan would be most effective?', opts: [
          'Rereading notes for sixty minutes the night before a test.',
          'Testing yourself for sixty minutes in one session.',
          'Rereading notes in three sessions on different days.',
          'Testing yourself in three twenty-minute sessions on different days.'],
          ans: 3,
          exp: '「分散学習（spacing effect）」と「テスト効果（testing effect）」の両方を満たすのはこれだけ。2つの条件を組み合わせて選ぶ問題。' },
        { q: 'Why, according to the speaker, do many students avoid this strategy?', opts: [
          'It feels more difficult than other methods.',
          'It requires expensive materials.',
          'It works only for vocabulary.',
          'Teachers discourage it.'],
          ans: 0,
          exp: '最後の文。一夜漬け（cramming）より難しく、効率が悪いように感じるので、多くの学生が使わない。' }] }
  ],
  vocab: [
    ['conduct', '行う', 'In the eighteen eighties, the German psychologist Hermann Ebbinghaus conducted an unusual experiment on himself.'],
    ['syllable', '音節', 'He memorized lists of meaningless syllables, and then tested how much he could remember after different periods of time.'],
    ['portion', '部分', 'A large portion of the material was lost within the first day, after which the decline slowed down.'],
    ['decline', '低下', 'A large portion of the material was lost within the first day, after which the decline slowed down.'],
    ['restore', '元に戻す', 'In other words, reviewing does not simply restore memory.'],
    ['durable', '長持ちする', 'It makes memory more durable.'],
    ['retention', '保持・定着', 'If you have, say, sixty minutes to study a set of vocabulary, spreading that time over three separate days produces far better long-term retention than spending all sixty minutes in one session.'],
    ['productive', '生産的な', 'Simply rereading notes feels productive, but it is a relatively weak way to learn.'],
    ['cramming', '一夜漬け', 'The irony is that this approach often feels harder and less efficient than cramming, which is precisely why many students do not use it.'],
    ['be worth ~', '〜の価値がある', 'It just wasn\'t worth the two-hour wait to get in.'],
    ['extend', '延長する', 'Since the library extended its hours, I\'ve been studying there instead of at the cafe.'],
    ['embarrassing', '恥ずかしい', 'But I\'d have to talk about some embarrassing moments.']
  ]
}

];
