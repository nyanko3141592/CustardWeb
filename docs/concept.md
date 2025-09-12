azooKey というキーボードのキーボードのデザインは JSON で作成できます

仕様はこれ
https://github.com/azooKey/CustardKit?tab=readme-ov-file

作るときに手動で入れていくのは面倒。
なので Gemini API にリクエストして、JSON の変更を重ねて改善していける感じにしたいです

サイトとしてはデフォルトの形式がいくつかあって、まずはそれを選んで、それに対して指示をしながら改善していく感じにしたい
どういう感じに表示されるかのモックも表示されるようにしたい

テキストベースで指示をして JSON を生成していきたい。まずは精査して JSON の形式をよく調べて

アプリ
https://github.com/azooKey/azooKey
