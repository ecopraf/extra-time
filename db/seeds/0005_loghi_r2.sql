-- EXTRA TIME — Collegamento loghi societa' (R2)
-- media.kind='image', caption='logo'. Idempotente.

begin;

insert into media (id, kind, provider, url, caption) values
  ('28bc8c53-6b28-4838-8e21-62b316d8dbf3', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/077027f0-a644-4b44-8100-cf4324df91ab.png', 'logo'),
  ('fe42a632-e38d-45bb-8807-dee77cb4c7ce', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/edbfa51c-7d69-4e3b-8b30-25b7d575697f.png', 'logo'),
  ('de1e4d6e-dc7b-44bf-8c7b-cc76ac9f9fb2', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/4dd20d0e-86f7-4094-8188-ddd2d979e54f.png', 'logo'),
  ('772b03fd-99a1-4760-8ec0-c0083ac5da05', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/88f12af0-aaa8-48c8-8d1a-38db430038ec.png', 'logo'),
  ('1bc2ea17-ce2a-4267-8c4e-5e9748f573ad', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/31e8207f-5381-4d9c-8cfc-9751ef064159.png', 'logo'),
  ('d6f472a0-2d35-40df-8ad4-574023c07f34', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/4750dd5b-9e1d-4a2c-8eb3-586e2d1889c8.png', 'logo'),
  ('5805ab48-ec32-4a1e-8aca-b4f25fc4a919', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c7e47f27-d7bf-4ef1-844b-e659bbf7ef2e.png', 'logo'),
  ('9a2f518c-e322-4e2c-859d-a90925742142', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/5c963b6e-14c1-423c-8771-da948fd08bc7.png', 'logo'),
  ('af7d14be-13a0-4fd8-84b3-3115e2b06529', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/bbad7ebc-bd38-413d-8fd1-822d07b5f3fd.png', 'logo'),
  ('68952b40-0fbe-4657-8adc-d97d0227bfef', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/fcb6295d-630f-4c60-8aa9-4409779dfb06.png', 'logo'),
  ('448e564e-95f0-4926-8f51-21c16323038c', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/fb380fb1-4dea-4b11-8eb5-631d27d517fa.png', 'logo'),
  ('a26cafee-8851-40c0-8230-c9aba3773fe4', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/6d727139-71e9-4c1b-88c4-0e7eb3a13d32.png', 'logo'),
  ('eccbe76b-cd37-44a9-8928-c93d4f751c49', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/31b91e5e-47ac-4ed5-8019-e19d58addc56.png', 'logo'),
  ('979fa67e-977e-4f56-8f20-68f275df1976', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/074bf37b-5e3e-46ea-8247-282183ff47b7.png', 'logo'),
  ('4c2149c0-b665-4e26-8cc9-e92d23876f18', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/8e5a596e-642e-4384-804e-a233fc2336ae.png', 'logo'),
  ('da51d6fc-0103-4daf-85e3-74236c4cdfbd', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c46d39f7-514e-4f5a-80b0-8fd0c2bf2590.png', 'logo'),
  ('3fe3b546-31ae-4096-819e-b0d85c75826d', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/215323d5-51bd-4f0b-8946-ca2cf4dc5676.png', 'logo'),
  ('2617010c-71ab-4460-8156-85a95b2dd8f5', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b46af6eb-87b8-45d6-8cc0-cdee697de70a.png', 'logo'),
  ('b0d6d3ed-55f3-43c1-80f8-a936bdd8530c', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a8d3cdd5-d5ea-4c07-8a33-a9f09b981797.png', 'logo'),
  ('83e6b6f3-2e52-478e-8321-97436be4df1d', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/693bbf04-67b6-48bb-8e01-477549412357.png', 'logo'),
  ('b1abdb81-a37f-4a12-82b0-7a01ea18832a', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a0000000-0000-4000-8000-000000000001.png', 'logo'),
  ('fa855bb0-6a79-4935-809f-b204041b33c3', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/80948654-228c-447e-8d5a-b0f2207dc986.png', 'logo'),
  ('2cbfcfdf-097f-4b0b-8d52-b7da84a39c49', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/1217db8e-fb03-4c2e-8b75-87ff5256f3fb.png', 'logo'),
  ('64046e14-356c-401e-8f88-81802885bc51', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d38f9c38-c867-4eba-8595-3369df1dbe48.png', 'logo'),
  ('69f0ade4-433e-47f7-8808-d1c1e4437f0b', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/0f5c0c19-b6d5-4282-8170-7864daa5b6f7.png', 'logo'),
  ('b8141c1a-7213-4af6-813b-a56dad83c9e8', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/0256a36f-62d8-4e12-88a7-f14765a25e7e.png', 'logo'),
  ('e93151a9-5808-4f6e-8282-e07b581493fa', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/dc2c6214-d34f-4439-8e38-e6266c13c826.png', 'logo'),
  ('08110701-eddb-40f9-84b1-c6c6dc49a334', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/e0519cf7-38e9-4f39-884c-91c13ba50a7f.png', 'logo'),
  ('8b0fd97c-15ed-4bc3-811a-d7ea393869df', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/363cf9b9-2264-40ce-817a-7c4070b3ba90.png', 'logo'),
  ('5d011640-3d55-4d1e-879f-ec850d2b4ab0', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/7e15c0bc-3116-432d-8036-8033a88e49f0.png', 'logo'),
  ('374f710c-51f4-4b3d-81ef-6b3882da601e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/56ff8ca9-d0c7-4438-8d99-146982d86843.png', 'logo'),
  ('4e208359-e592-4bf0-8673-bb4e5313fbbf', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/96d5f42d-c727-46ac-88ea-f0c758c072d2.png', 'logo'),
  ('f4b54e88-e58b-4a68-8af8-8fdef55285c1', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/43a87c07-730e-44ec-837c-1a9875371670.png', 'logo'),
  ('b521483a-9550-4b2b-8846-ecd2d75c43b2', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a27c3406-1731-4ec4-8228-ab452b547ad4.png', 'logo'),
  ('683fc248-7bc3-4911-8517-3e546ca1eac1', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d7c79281-956d-45b0-8855-349eb8ff647d.png', 'logo'),
  ('e2fb5a08-de4d-43b1-8f3e-fff821a90799', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/f6f782e1-e655-4df0-816a-df2f3a08e17a.png', 'logo'),
  ('56f9b24a-6617-4640-88e7-04f83f827a3c', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/4f413e37-91a5-4d4a-89b9-2959da47308d.png', 'logo'),
  ('80cda32e-82b1-49fe-815f-7ff302058fd9', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/97ad024d-4578-46a3-8bcf-d6c50ef36eb9.png', 'logo'),
  ('6ade0c2b-0fd3-4ac3-867c-74ca8cd673ce', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/1c44a608-6762-4867-858e-08b43c1e419a.png', 'logo'),
  ('006a10b0-55ed-4692-8a6b-3d72e7548606', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/72e24049-9131-4672-8a87-44c8463c9043.png', 'logo'),
  ('d4d946cf-037f-44a0-84f5-f5e6b49c94ac', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/3ef48f6d-5d69-40fe-88c3-675b90256c7c.png', 'logo'),
  ('cfd967c6-0cf1-4bc9-8c0f-cd1b737b9505', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d2cae424-54ed-441d-832a-7b4423c0eb3f.png', 'logo'),
  ('bc9c80d9-7407-4573-8b31-e094c1b1b440', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/88391c0d-d2f3-43d7-88c0-e6a87e167a56.png', 'logo'),
  ('7918f857-95ce-4a40-81ff-4f3df2a480a7', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/9c038c6f-0f19-4aa5-80b1-98979bdc61c9.png', 'logo'),
  ('fbe9c583-2967-4e1e-8c4a-19485cd21959', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/612742a7-362a-483c-867a-a394f31ccec2.png', 'logo'),
  ('1e370edc-d5a4-4c18-89cb-d3ecd2d48a1a', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/bd4164ca-6687-4c4d-8e57-f16a52d981c8.png', 'logo'),
  ('7ce1ec4a-a072-4963-80f0-2fb5e08b7053', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/4d2592f9-c463-4ceb-8cd6-f84fb2c41333.png', 'logo'),
  ('73c51d07-c783-45d4-80d0-5fd24fc12505', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/45f4abec-de0d-4dbc-8bbc-8893f3070e52.png', 'logo'),
  ('66053fe1-ee8b-48ce-831b-6edb9458bd83', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/8a71ce0a-b2eb-4f84-817d-06b36d75e814.png', 'logo'),
  ('4c6f4834-cee5-44a4-8619-04f2eaf1ccdd', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b7da88ff-d7e6-453a-8ec0-00c471643691.png', 'logo'),
  ('1b31d36b-548c-4212-8c8f-34492f0a8ee0', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/5cbfbab8-bf6a-4a2a-8d58-d4d9e62519c5.png', 'logo'),
  ('e3f1146b-92eb-40c9-8ad2-723d8d3f77dd', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b4dff36b-1b17-47bc-86b4-84fcf838fedb.png', 'logo'),
  ('17d799a1-536d-4195-8f18-9c3fbfb9b54f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/e07508d4-254e-4e74-84f2-6df4e951f30f.png', 'logo'),
  ('84ca3ac5-33fc-4261-8de2-4e93dcd5d96f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/01dcf8c7-6c8a-4ee7-83b1-965a43efca05.png', 'logo'),
  ('48a17640-6611-455f-84cd-a5aed721abf6', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/32904ea7-7e8e-4cb2-8cf0-f74cdace4755.png', 'logo'),
  ('dc88b467-6e65-4615-81ef-b55ab80e8fd6', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/f0a35efd-9ed0-4344-8efb-ca1cb5cb832c.png', 'logo'),
  ('76dfc2b5-fbde-4131-8c1e-b60101974c2b', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/444993d4-febc-4518-8843-305f1144888b.png', 'logo'),
  ('66fe22dd-521a-4d57-8ca1-4a44baa17afe', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/f1d60cf2-a2c1-4dc9-8153-6a5dff8f366f.png', 'logo'),
  ('babeb1e4-37f2-4510-85e0-7b679aaf5a24', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/df100b4b-0f28-40d3-8cbf-cdcc073fd58c.png', 'logo'),
  ('4d9d5ec0-d20c-40f6-82bd-c2399c0363fe', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/72d509ff-f2c1-4fde-82d0-f32b2caf8f94.png', 'logo'),
  ('6cf755a3-5947-4616-82b0-0dd37937c1db', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/29bbd0ea-d0aa-4b01-86c2-63676949e23f.png', 'logo'),
  ('e6850239-9eeb-4964-850a-91796dce8a1b', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/49960c8f-9262-4a0e-8d1e-c529d10d5e46.png', 'logo'),
  ('64e0be1d-d2d7-4fac-84d8-a43fbb851367', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/bbca24a7-9791-4af8-8183-cc661cd6a124.png', 'logo'),
  ('654518c9-2261-4051-8719-6e44544839c8', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/0c8800b3-5e62-492b-8888-83597253120e.png', 'logo'),
  ('e83fa7ce-4d2f-42ba-864e-56eccd9e78c4', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/bcd907ce-87fc-4f79-8f5a-9f798bd64522.png', 'logo'),
  ('074f6c81-4e6c-4692-81fb-6385a3246766', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c3b6690c-d908-4ca5-8ec5-c18858214a10.png', 'logo'),
  ('3cdc106e-1709-4b5f-8e81-9044db0ee52e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/f96dd9f9-4be2-470b-8afd-c64be0778a95.png', 'logo'),
  ('163b05ae-0d99-4afa-825a-4be235ac729d', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c6cfb089-a2a6-4ae3-8166-514f600b116f.png', 'logo'),
  ('5a0f4a28-b4a8-429d-8b04-fe79125640cb', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/2911c510-1491-4f92-88e7-3a76bd6d0b43.png', 'logo'),
  ('8ed2c8ec-dd2c-4a33-86e8-15b42a0e5f02', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/85776e81-a7b4-4ab8-880c-4aaf7cb46b45.png', 'logo'),
  ('04b15f2c-4571-42e1-8bb7-cae7e0355faa', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b4646b52-7783-45e4-810d-38d83ac2968d.png', 'logo'),
  ('ae9d835a-80d6-4051-8f0f-522cf85b1623', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/76b39edd-97c1-408d-8556-5931ecf7c856.png', 'logo'),
  ('036f4024-051f-4896-89f2-4fad8ef37488', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/15074614-ae7f-492b-8e4f-78735b2ae7ab.png', 'logo'),
  ('e35a86c5-d218-4f4c-8c3f-c71cd7a64a58', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b7d171b1-05ca-4848-884c-049ff8dd47d0.png', 'logo'),
  ('09b0fdb6-7f9b-46ed-89b8-a9c14029afe5', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/59296a5e-0965-420b-823b-62a498b6e45f.png', 'logo'),
  ('19fa4df4-5067-4e31-8f5c-272cb51e52da', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/886579eb-fd94-4606-8760-fa6cd0631db5.png', 'logo'),
  ('fa3b57a7-5220-407f-86c3-0b61e4f9de45', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/40479ca7-67bd-4652-82be-2a4a6fd007ec.png', 'logo'),
  ('fc5f4601-90a1-460a-8f41-2a52bc48b599', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/41dbef08-78eb-4d3a-8871-e0dc09e80a44.png', 'logo'),
  ('a8b90f54-4ee6-472c-8873-3ed634fa7f36', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/99a9d1c7-13d6-4617-87f9-f97896701aa5.png', 'logo'),
  ('22afeec5-0c8a-47a0-86b2-a8f59723cc5b', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/573f3062-70a1-4bd4-88cd-6c0ee3d1b853.png', 'logo'),
  ('014820fd-d0ed-49cb-8389-0e9a4838c799', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/8f8b9380-9212-4e7a-8b1f-bc10dbc8cddc.png', 'logo'),
  ('55044880-c5f8-42cf-8fe6-33b08c427f0e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d5c85293-5079-4869-81e9-9b738956c8ec.png', 'logo'),
  ('a3c83dcc-aeea-4195-8937-509dc9f40bf1', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c8928090-08de-48fb-87b3-7d737cf77971.png', 'logo'),
  ('a7bc075e-e1c3-465b-8f4a-9d5e60639a22', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/056b8126-eed6-4efe-8f1b-39b7d064956a.png', 'logo'),
  ('d4010022-da6e-4409-8760-e3708a8ac587', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/f5f45f01-2540-48a6-8060-73bef7b44ea4.png', 'logo'),
  ('838a9046-cbb8-4dcd-8ee6-afe187736a91', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/2697b6c7-0268-4173-8ace-99e82053e30b.png', 'logo'),
  ('4df37ba8-3f5e-4292-8b27-d916c7046b7c', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c94f0d01-57a0-4bd8-8a69-1d335a5df5dd.png', 'logo'),
  ('9be502c1-2a16-458c-888f-c2583e9d2e07', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d0191047-1954-48a0-81c8-ed2f35f3c13a.png', 'logo'),
  ('41f5d6c0-eee9-4e78-80d5-f58b8a110a40', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/3adb8fb6-b65c-47ad-8de7-be8191a28648.png', 'logo'),
  ('8ac6a81e-5f93-4622-89ca-ef9f98e228f8', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a0000000-0000-4000-8000-000000000002.png', 'logo'),
  ('6a0461d9-bd98-43c9-8476-d2a657e94ec7', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/ca737381-82b9-4d75-8aa5-fa1e11b3e78f.png', 'logo'),
  ('b8731b06-419d-41a9-8fc5-0ca08af5fa60', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/6c3d1649-cb26-410e-849a-cd3932a4f750.png', 'logo'),
  ('7431922b-9ef7-4092-8c70-a53f2a5436fa', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/231a71dc-0be2-4b65-8783-a4623511e756.png', 'logo'),
  ('0c0c7c5d-dacb-44da-8e04-4a3f10977c67', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/0c00a3c4-92db-489e-8dda-f109f1713805.png', 'logo'),
  ('69261839-d7b6-46be-812e-51cdcb23a667', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b768304d-506c-4636-8335-d6702566c482.png', 'logo'),
  ('7d980ecd-676d-4915-80ee-5ff8f47dcda2', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/84bc76e3-0651-4252-8d88-365dd2c9a3f8.png', 'logo'),
  ('52f918a0-b325-44de-8b65-7b0f199760c7', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/7f2f7911-39e3-46ec-86f2-cf6b2e5010de.png', 'logo'),
  ('8cc22d68-98f2-40fa-80db-a50113283b6f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c6d31c56-f2e7-4d89-8fd7-b17d4ef47326.png', 'logo'),
  ('19a0cc34-4ed9-4c19-89b0-9f1271c1aa53', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/36c204f4-c51e-429d-8962-1807c69f1579.png', 'logo'),
  ('86c309fe-7a9a-4bd8-865b-9c115cb9e747', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/8675e5c5-d9ec-4124-8c94-b9dcba2701b0.png', 'logo'),
  ('f970e376-1ae1-4941-86a9-40ea1c68b04f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/013e344f-bad2-4270-856d-671e609f2eef.png', 'logo'),
  ('9abd6eb7-fc84-41a5-84ab-2d8be5db73d4', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/e45f2f0a-801c-4332-80a1-688174a6a6d7.png', 'logo'),
  ('2eaf2b0b-6fad-415d-8aa4-f3f0e32b7af2', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c1af9532-bbbf-4a90-89aa-01349bae3d6a.png', 'logo'),
  ('c4ee2e41-9ac4-4645-892d-5e97504b8af7', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/9c99fb23-6158-4d98-81c9-6d6977ec0e0c.png', 'logo'),
  ('f75dc4e7-5e2a-4f1b-8c04-304027498b6e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/2bf93706-5cd9-4408-89a3-b1091d7939c9.png', 'logo'),
  ('bcdc1adf-bf24-4db1-8d4c-5a34e7e6c14c', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d85fb3b6-80dc-40ad-85b4-84191eac999b.png', 'logo'),
  ('be42f488-edf5-47bc-8fa6-bf0d3d679263', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/25448586-1872-4b92-81bf-de6a9bd25bf3.png', 'logo'),
  ('4329cae1-a429-4247-86d8-a45d18d9fad7', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/e586dcf9-7939-4dab-898b-646b28142f69.png', 'logo'),
  ('7dc20e5f-b4b8-4230-8c81-42ff7d37c4b4', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/87420cf1-f86e-4157-86e2-22cbf5417ed0.png', 'logo'),
  ('52ec835a-879c-4123-8cc9-1a0aeef5ed21', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a0000000-0000-4000-8000-000000000003.png', 'logo'),
  ('07cd7365-fe8e-4295-89f8-e7159f693144', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/4d7d8cc9-6ea4-44da-807a-6e3648026262.png', 'logo'),
  ('12bc4447-8b8d-48b7-8c92-400ec440e312', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c2cfcfa2-2647-4ded-8630-e15b7e6c5c13.png', 'logo'),
  ('6802f97a-60b6-415a-8743-c1ae37fdcfe7', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/96f142e0-b111-454a-8445-37b48bc62b74.png', 'logo'),
  ('c5d82024-b4c5-41dd-8c27-098e40489ca6', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c790c1be-fbfc-4ae2-8e77-6e0e822476f9.png', 'logo'),
  ('9a3e40bf-ab0b-466d-8efd-f9dfcca0a36a', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/63ab9e2c-f9fa-472e-8e66-19ddc4c1f255.png', 'logo'),
  ('d2cae5e2-2ae7-40f1-899c-0479090530f3', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/9a715a6e-20f6-4577-8bb1-ad54fc7da2e3.png', 'logo'),
  ('fccbd3b5-5ffa-433c-8529-4718b67ca4eb', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/f7d5a832-dc8b-4b51-8be4-2992aadd6a6c.png', 'logo'),
  ('80a47608-0070-423d-8bc9-31a8036d0775', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/3020e557-ed25-487a-8b2d-585066506bb2.png', 'logo'),
  ('b03b9e67-a7d5-4276-89c7-91949aa7579f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/993b8334-c3dd-4332-88a9-313b5a37a08d.png', 'logo'),
  ('3f7629b0-d66e-4455-8fb5-a4b63e2d682f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/2a0059ef-76d5-4414-8399-556facad94a5.png', 'logo'),
  ('905784c9-2500-4617-8840-32ba0baa4280', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/8d21f43f-1b2c-4697-817c-899aa4d63527.png', 'logo'),
  ('6b6fbdb0-d94c-4745-8fa4-3fd32ff0073d', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b92a7a3e-a2ad-4937-873d-4ec6880c01e6.png', 'logo'),
  ('a9f3b34d-ebb5-4395-8f83-6020c5498695', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/5a1217fd-cc3c-4ca2-80c6-cbbedfab7c4d.png', 'logo'),
  ('26462588-016f-4b70-8f37-8571cb8ec9d2', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d709b4c4-6ddf-4537-8bcc-fcd5bad2a8cb.png', 'logo'),
  ('82f63f14-a82d-43d7-89ee-2b0b8fce6647', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/490c67b8-681d-4fe9-803a-d69324d32779.png', 'logo'),
  ('b815ce77-f477-449a-81a3-b44cb883bf90', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/3172bb13-89bf-41e4-886a-a505a1fcd5e6.png', 'logo'),
  ('abfb63d9-e552-4496-8a8a-5d4f02ade4a7', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/cd049995-6cfa-4930-8694-300a1f27d138.png', 'logo'),
  ('3239aaff-dad6-4a09-8306-95a65edf7a78', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b61b68e3-b7fa-4272-824e-0273426a30ba.png', 'logo'),
  ('5750df51-837d-4084-8bb3-d6af3bf3b685', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/ee2ceb7f-6a54-43ca-847e-1a86788408bb.png', 'logo'),
  ('49b74bf0-3829-4476-869e-ad4a1ab12334', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/7e67d596-a7ae-46c1-8aeb-634e2f36b4cc.png', 'logo'),
  ('9eff58ee-5414-4013-8638-10cdad10aedc', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/992e3178-364a-4267-8675-9250fe13232b.png', 'logo'),
  ('b0d1dffb-d4e0-4e66-84d5-fc6512a88148', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/ae8ad1e5-c2d9-440b-8f2f-21c45522a36a.png', 'logo'),
  ('fb5ccec4-2dd7-4e35-8dc7-3adc39e52d93', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/2ec7f86a-c6fd-45db-8d5e-b57e849432ea.png', 'logo'),
  ('5024954c-1b4c-4c9a-8389-f1470189c046', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/684b3ca0-e1d5-4e92-8c86-6ea03bf505e1.png', 'logo'),
  ('f0728466-db6a-4c39-848f-985d71f00adc', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/cb62bb0a-a97c-477c-81e6-e48e775c737b.png', 'logo'),
  ('7b694a79-8e59-4184-8d59-fb22635bd7d3', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/51ee3eec-c986-41d9-87e6-7d57e15e47b4.png', 'logo'),
  ('abb363a7-6434-4375-8c9d-3056409ed31f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/7fba1503-b015-4630-850d-d850162f4c36.png', 'logo'),
  ('0edb621b-7f20-461e-8286-1ca7ecfd369e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d1c21376-8098-486b-81ea-057e9bf6502b.png', 'logo'),
  ('cd491b33-2633-4774-86af-b8945f058896', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c4fb7bdb-b6e7-4760-81c3-4292a816f764.png', 'logo'),
  ('4def1ad2-2ddd-455e-80d7-2e26f48abc04', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/829e873d-ec2f-418f-8302-af21d89be010.png', 'logo'),
  ('c56b2402-a556-4cd8-81b3-591910bc71d7', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/56ffd904-f807-45c4-8cee-4ede722e1e4c.png', 'logo'),
  ('f3ef62e2-2406-4849-871b-8d13f91a1915', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/8b8fd7eb-73e4-47cf-821e-f7d0cff1f85d.png', 'logo'),
  ('505f4549-6343-46e3-85df-7d3d66ac71c2', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/3687d798-ef89-45dc-842a-13e686ef2e00.png', 'logo'),
  ('242427d7-cdd8-4748-8e04-dd888f642eae', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d346cfde-0583-493d-81a1-960a3ca41d3b.png', 'logo'),
  ('8f73f37d-bb8d-4b1a-865a-44ee72bb7dcf', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/95d57689-54fd-461b-887b-a76c26b9eeff.png', 'logo'),
  ('a4b3e1f1-ec95-4591-8c94-018b2f55e735', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/9a055a6b-8f96-4061-8935-bc2faf074593.png', 'logo'),
  ('ff0d4344-b0e9-408c-8848-3152c6c01273', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c1ca5d09-57a9-4ad3-861b-b403ed7f9d9e.png', 'logo'),
  ('a0e0c229-a352-4992-8fd9-64eaf8c46586', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/73d773d4-c6dc-4f53-882e-89866ea1b8f7.png', 'logo'),
  ('d560cc0e-d1ac-47c2-8713-fe8f4fb1f600', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/ee69fa35-8b7f-4fd7-857e-2eaf24ef34a8.png', 'logo'),
  ('251254dd-d2da-4892-820e-7694caae6413', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/997c9217-0411-4168-8592-8c9e23eccc7d.png', 'logo'),
  ('22cae263-9420-4bda-8674-991b672bf080', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/ffe7563d-8df7-44ef-8376-78574154732c.png', 'logo'),
  ('dd547cdf-35bb-49ab-8a11-3f5287ee26d1', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/2eb79394-2494-4e59-8c09-c27e17e6e0a5.png', 'logo'),
  ('2252366a-6f6f-47b8-86c1-ae79eac67f48', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/8d619d6c-9ed4-4d2f-8274-085510c496d6.png', 'logo'),
  ('cdf8b318-62ea-4fb2-8bdc-5ccd3fccc44f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/899d1cdd-74c7-4ab9-8217-c469a3d0a25c.png', 'logo'),
  ('db5ba75a-75f0-4ae1-8983-e0d386c2d3f1', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/ca3889b6-f0d5-408a-8104-653b63b274dd.png', 'logo'),
  ('ce3cda65-cf85-46a2-80c7-acd952c4db48', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/31b53ae7-78c7-44f5-8b20-5c65baa7f527.png', 'logo'),
  ('a3ef070b-368a-4a12-87b9-236b69cf280e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/f214d80d-3b07-49b6-8d06-a7f04d52da52.png', 'logo'),
  ('3a45b8ca-0f07-44cf-8fb3-c6f17b2a8b9f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/aefda2f5-c71c-4b5d-80d8-89f34695a9c3.png', 'logo'),
  ('2ec4eb27-a4f5-4114-82d8-7e46e35e6c37', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/fbda04b2-8a25-4e95-83d5-137bd497aba1.png', 'logo'),
  ('baf2992e-91b9-40e9-8d72-569c5406149e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c3569518-767f-4146-8133-394871b2e4cc.png', 'logo'),
  ('3779f8d6-c82b-4fce-81d8-6b6fe934685d', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/1bdbbd05-771a-4c2b-8781-9f84dfacba56.png', 'logo'),
  ('05143934-b91a-424c-897a-c394bad7c432', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/901dff06-3633-47e4-810e-9770ed762ea3.png', 'logo'),
  ('53ce66b3-9bbc-4411-8e0d-acf1636ba15d', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/dd633903-6037-40e1-8c79-00fd19a9dfa4.png', 'logo'),
  ('805ed97d-167d-4614-898f-87c3e3bc08fe', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a156a7c5-3a22-4201-8c88-208b6d4631d2.png', 'logo'),
  ('cb626ab7-b859-4aff-8070-672ed56ebe01', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/9b4a4fc7-ee35-4aac-8157-1400e43c0c23.png', 'logo'),
  ('9ac721e1-ce04-4c3d-804c-7d5cff536217', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/4d09f0c3-fe06-4bcf-8a18-ee0b41a93604.png', 'logo'),
  ('a2331f17-3934-4e63-8b30-21e78fa9e91e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/4b085022-0919-47dc-8ca9-5bd8ae13651d.png', 'logo'),
  ('7dd14439-96bc-43f3-8b20-ab241b4e097f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/340254b4-d519-47f5-8314-644688efe810.png', 'logo'),
  ('2216098b-fada-422e-8a22-91db66f3a2e6', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/43eb2782-da0d-44cb-8494-bf1d37f60348.png', 'logo'),
  ('ff9549d5-ab8a-4f47-8a2e-7de70cca916e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/cd5670cb-aa1f-483c-8a26-a784063b7379.png', 'logo'),
  ('d647294d-1cbb-4e2f-83db-dc756ca5b098', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b2f06a1d-1875-4f51-831e-da5c0c618517.png', 'logo'),
  ('fe8fcdaa-a50f-40b3-81ed-e97e109afc2f', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a0000000-0000-4000-8000-000000000004.png', 'logo'),
  ('9b967924-8f52-4b2c-80e5-77fc54eaccf2', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/1d69df5f-ba11-4293-8e35-51d35960be93.png', 'logo'),
  ('b84dfbb2-dca5-405d-8fca-83a9ba778f27', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d2c5428b-7c95-42e3-8f93-e7df8d6a0056.png', 'logo'),
  ('460ecf57-f883-44b6-8a7e-c86e3a1fb567', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/2780b5e0-b6eb-4362-880c-b50dc16ed6d7.png', 'logo'),
  ('f9064cc2-f6ad-4f51-8480-b961c694f4ab', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/339c5307-52ff-4747-851b-c0356aede0ec.png', 'logo'),
  ('6697b0bf-b263-4638-8de3-9469ca69aef2', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/3833e918-8885-480c-83bb-828f1c132b3a.png', 'logo'),
  ('0a490c7d-4483-47e8-85f7-577d1425c5f1', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a0000000-0000-4000-8000-000000000005.png', 'logo'),
  ('8169d5b4-280b-414e-852c-54207042d60d', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/5b304045-7368-49b5-8232-a89b02a799ec.png', 'logo'),
  ('3425e391-b464-4dae-8b8b-c2bd4c6f6c38', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a0000000-0000-4000-8000-000000000006.png', 'logo'),
  ('020eec44-164d-42d0-8f03-78261c303856', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/9eb3203a-fc50-486a-863d-6fb1be96ad1d.png', 'logo'),
  ('9d7caef1-72cc-48d0-89ea-ad0b6ab3fd71', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/8bada927-9cab-4c82-8ac9-f0e147a5824c.png', 'logo'),
  ('2af3b151-b5cf-4d97-889b-7a2678af5043', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/06eba7a8-66e4-4559-8bb8-381af6cae37c.png', 'logo'),
  ('97d3de34-3c8e-43b1-8a91-39b94a5bdfb2', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/2c3c4ae0-5e28-4603-8ca2-8557aedf10f6.png', 'logo'),
  ('b526abd7-593a-4cbe-8e70-f2ca903af558', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/da1585c2-a648-46bb-8738-777effe8a2eb.png', 'logo'),
  ('33c77e7e-9bdd-4d8f-8c6e-aed0e91f6c28', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a522058f-02a1-4397-8db3-6ca9a271eccb.png', 'logo'),
  ('3c38d231-19b9-4b30-8337-6aa61b14945a', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a11f929b-ed85-4ec4-8a45-825436d8bcfb.png', 'logo'),
  ('264eba6e-5745-4703-832d-0752277983ae', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/bf848bb2-860c-483a-815d-22239e7733f7.png', 'logo'),
  ('cac249b4-b27b-422d-8441-4a5d650a2a2e', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/e80fbf6b-05e1-40a6-8cad-ec5938bf6b20.png', 'logo'),
  ('88038c44-d04a-4731-8055-4329a05eb7a4', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/2ca4cb97-5cb1-4af8-81a3-0b15fcbc0907.png', 'logo'),
  ('0db3573a-965e-4671-8ce3-57c11150bb08', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c6ab21b3-16b2-48c1-829e-8fec893ce7da.png', 'logo'),
  ('f0b1b908-3b9a-446d-88e5-6bbd91f95ffa', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/f07d121f-61a7-4f99-8de2-87585a6668d0.png', 'logo'),
  ('7bde1e0c-0a0d-4886-869c-1071fad45a96', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/0d8709bd-048d-4426-8412-0f2d82bec1d7.png', 'logo'),
  ('5e2b5fd3-c6c4-47f7-8e53-9ad5829045b6', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/74ce2615-c1ca-48f7-84e6-7d24a2630a87.png', 'logo'),
  ('26e324a0-c7e9-482c-8661-d505fb8868bb', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/5ab2ea49-ab98-4054-8ab9-af79252da337.png', 'logo'),
  ('498207c7-0ea8-472c-805c-2cc5a2634713', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/504a896f-487f-4978-8b69-0459705b0c80.png', 'logo'),
  ('4861e727-3fe2-4c8e-820d-9196ffa71422', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/feef20cc-8fe7-4760-8448-467a19f18282.png', 'logo'),
  ('34b7d0a5-ac26-4b36-89aa-29320d91f726', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/d88b4833-afdd-448c-83d5-79ed95e9798d.png', 'logo'),
  ('8fad2ef0-8ac5-4831-8747-aae22332d848', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/c2269a0d-43e4-4423-87ea-7d83a913388f.png', 'logo'),
  ('0810314a-350a-457d-8cea-327e80efef66', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/b172d3d0-3fbd-47b5-8735-c706326221ed.png', 'logo'),
  ('b9592c9c-d5f7-4784-8f04-b2ab37e55a1a', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/a4fdfc80-da91-4157-8ee4-a1056b7fa68e.png', 'logo'),
  ('41bcd9c3-ce33-4a1e-80a8-4f3013fa436d', 'image', 'r2', 'https://pub-91d5e73d42384e45bbdafe659211b9d3.r2.dev/clubs/8281bbb6-93b0-431c-8604-184c6802fc87.png', 'logo')
on conflict (id) do update set url = excluded.url;

update clubs set logo_media_id = '28bc8c53-6b28-4838-8e21-62b316d8dbf3' where id = '077027f0-a644-4b44-8100-cf4324df91ab';
update clubs set logo_media_id = 'fe42a632-e38d-45bb-8807-dee77cb4c7ce' where id = 'edbfa51c-7d69-4e3b-8b30-25b7d575697f';
update clubs set logo_media_id = 'de1e4d6e-dc7b-44bf-8c7b-cc76ac9f9fb2' where id = '4dd20d0e-86f7-4094-8188-ddd2d979e54f';
update clubs set logo_media_id = '772b03fd-99a1-4760-8ec0-c0083ac5da05' where id = '88f12af0-aaa8-48c8-8d1a-38db430038ec';
update clubs set logo_media_id = '1bc2ea17-ce2a-4267-8c4e-5e9748f573ad' where id = '31e8207f-5381-4d9c-8cfc-9751ef064159';
update clubs set logo_media_id = 'd6f472a0-2d35-40df-8ad4-574023c07f34' where id = '4750dd5b-9e1d-4a2c-8eb3-586e2d1889c8';
update clubs set logo_media_id = '5805ab48-ec32-4a1e-8aca-b4f25fc4a919' where id = 'c7e47f27-d7bf-4ef1-844b-e659bbf7ef2e';
update clubs set logo_media_id = '9a2f518c-e322-4e2c-859d-a90925742142' where id = '5c963b6e-14c1-423c-8771-da948fd08bc7';
update clubs set logo_media_id = 'af7d14be-13a0-4fd8-84b3-3115e2b06529' where id = 'bbad7ebc-bd38-413d-8fd1-822d07b5f3fd';
update clubs set logo_media_id = '68952b40-0fbe-4657-8adc-d97d0227bfef' where id = 'fcb6295d-630f-4c60-8aa9-4409779dfb06';
update clubs set logo_media_id = '448e564e-95f0-4926-8f51-21c16323038c' where id = 'fb380fb1-4dea-4b11-8eb5-631d27d517fa';
update clubs set logo_media_id = 'a26cafee-8851-40c0-8230-c9aba3773fe4' where id = '6d727139-71e9-4c1b-88c4-0e7eb3a13d32';
update clubs set logo_media_id = 'eccbe76b-cd37-44a9-8928-c93d4f751c49' where id = '31b91e5e-47ac-4ed5-8019-e19d58addc56';
update clubs set logo_media_id = '979fa67e-977e-4f56-8f20-68f275df1976' where id = '074bf37b-5e3e-46ea-8247-282183ff47b7';
update clubs set logo_media_id = '4c2149c0-b665-4e26-8cc9-e92d23876f18' where id = '8e5a596e-642e-4384-804e-a233fc2336ae';
update clubs set logo_media_id = 'da51d6fc-0103-4daf-85e3-74236c4cdfbd' where id = 'c46d39f7-514e-4f5a-80b0-8fd0c2bf2590';
update clubs set logo_media_id = '3fe3b546-31ae-4096-819e-b0d85c75826d' where id = '215323d5-51bd-4f0b-8946-ca2cf4dc5676';
update clubs set logo_media_id = '2617010c-71ab-4460-8156-85a95b2dd8f5' where id = 'b46af6eb-87b8-45d6-8cc0-cdee697de70a';
update clubs set logo_media_id = 'b0d6d3ed-55f3-43c1-80f8-a936bdd8530c' where id = 'a8d3cdd5-d5ea-4c07-8a33-a9f09b981797';
update clubs set logo_media_id = '83e6b6f3-2e52-478e-8321-97436be4df1d' where id = '693bbf04-67b6-48bb-8e01-477549412357';
update clubs set logo_media_id = 'b1abdb81-a37f-4a12-82b0-7a01ea18832a' where id = 'a0000000-0000-4000-8000-000000000001';
update clubs set logo_media_id = 'fa855bb0-6a79-4935-809f-b204041b33c3' where id = '80948654-228c-447e-8d5a-b0f2207dc986';
update clubs set logo_media_id = '2cbfcfdf-097f-4b0b-8d52-b7da84a39c49' where id = '1217db8e-fb03-4c2e-8b75-87ff5256f3fb';
update clubs set logo_media_id = '64046e14-356c-401e-8f88-81802885bc51' where id = 'd38f9c38-c867-4eba-8595-3369df1dbe48';
update clubs set logo_media_id = '69f0ade4-433e-47f7-8808-d1c1e4437f0b' where id = '0f5c0c19-b6d5-4282-8170-7864daa5b6f7';
update clubs set logo_media_id = 'b8141c1a-7213-4af6-813b-a56dad83c9e8' where id = '0256a36f-62d8-4e12-88a7-f14765a25e7e';
update clubs set logo_media_id = 'e93151a9-5808-4f6e-8282-e07b581493fa' where id = 'dc2c6214-d34f-4439-8e38-e6266c13c826';
update clubs set logo_media_id = '08110701-eddb-40f9-84b1-c6c6dc49a334' where id = 'e0519cf7-38e9-4f39-884c-91c13ba50a7f';
update clubs set logo_media_id = '8b0fd97c-15ed-4bc3-811a-d7ea393869df' where id = '363cf9b9-2264-40ce-817a-7c4070b3ba90';
update clubs set logo_media_id = '5d011640-3d55-4d1e-879f-ec850d2b4ab0' where id = '7e15c0bc-3116-432d-8036-8033a88e49f0';
update clubs set logo_media_id = '374f710c-51f4-4b3d-81ef-6b3882da601e' where id = '56ff8ca9-d0c7-4438-8d99-146982d86843';
update clubs set logo_media_id = '4e208359-e592-4bf0-8673-bb4e5313fbbf' where id = '96d5f42d-c727-46ac-88ea-f0c758c072d2';
update clubs set logo_media_id = 'f4b54e88-e58b-4a68-8af8-8fdef55285c1' where id = '43a87c07-730e-44ec-837c-1a9875371670';
update clubs set logo_media_id = 'b521483a-9550-4b2b-8846-ecd2d75c43b2' where id = 'a27c3406-1731-4ec4-8228-ab452b547ad4';
update clubs set logo_media_id = '683fc248-7bc3-4911-8517-3e546ca1eac1' where id = 'd7c79281-956d-45b0-8855-349eb8ff647d';
update clubs set logo_media_id = 'e2fb5a08-de4d-43b1-8f3e-fff821a90799' where id = 'f6f782e1-e655-4df0-816a-df2f3a08e17a';
update clubs set logo_media_id = '56f9b24a-6617-4640-88e7-04f83f827a3c' where id = '4f413e37-91a5-4d4a-89b9-2959da47308d';
update clubs set logo_media_id = '80cda32e-82b1-49fe-815f-7ff302058fd9' where id = '97ad024d-4578-46a3-8bcf-d6c50ef36eb9';
update clubs set logo_media_id = '6ade0c2b-0fd3-4ac3-867c-74ca8cd673ce' where id = '1c44a608-6762-4867-858e-08b43c1e419a';
update clubs set logo_media_id = '006a10b0-55ed-4692-8a6b-3d72e7548606' where id = '72e24049-9131-4672-8a87-44c8463c9043';
update clubs set logo_media_id = 'd4d946cf-037f-44a0-84f5-f5e6b49c94ac' where id = '3ef48f6d-5d69-40fe-88c3-675b90256c7c';
update clubs set logo_media_id = 'cfd967c6-0cf1-4bc9-8c0f-cd1b737b9505' where id = 'd2cae424-54ed-441d-832a-7b4423c0eb3f';
update clubs set logo_media_id = 'bc9c80d9-7407-4573-8b31-e094c1b1b440' where id = '88391c0d-d2f3-43d7-88c0-e6a87e167a56';
update clubs set logo_media_id = '7918f857-95ce-4a40-81ff-4f3df2a480a7' where id = '9c038c6f-0f19-4aa5-80b1-98979bdc61c9';
update clubs set logo_media_id = 'fbe9c583-2967-4e1e-8c4a-19485cd21959' where id = '612742a7-362a-483c-867a-a394f31ccec2';
update clubs set logo_media_id = '1e370edc-d5a4-4c18-89cb-d3ecd2d48a1a' where id = 'bd4164ca-6687-4c4d-8e57-f16a52d981c8';
update clubs set logo_media_id = '7ce1ec4a-a072-4963-80f0-2fb5e08b7053' where id = '4d2592f9-c463-4ceb-8cd6-f84fb2c41333';
update clubs set logo_media_id = '73c51d07-c783-45d4-80d0-5fd24fc12505' where id = '45f4abec-de0d-4dbc-8bbc-8893f3070e52';
update clubs set logo_media_id = '66053fe1-ee8b-48ce-831b-6edb9458bd83' where id = '8a71ce0a-b2eb-4f84-817d-06b36d75e814';
update clubs set logo_media_id = '4c6f4834-cee5-44a4-8619-04f2eaf1ccdd' where id = 'b7da88ff-d7e6-453a-8ec0-00c471643691';
update clubs set logo_media_id = '1b31d36b-548c-4212-8c8f-34492f0a8ee0' where id = '5cbfbab8-bf6a-4a2a-8d58-d4d9e62519c5';
update clubs set logo_media_id = 'e3f1146b-92eb-40c9-8ad2-723d8d3f77dd' where id = 'b4dff36b-1b17-47bc-86b4-84fcf838fedb';
update clubs set logo_media_id = '17d799a1-536d-4195-8f18-9c3fbfb9b54f' where id = 'e07508d4-254e-4e74-84f2-6df4e951f30f';
update clubs set logo_media_id = '84ca3ac5-33fc-4261-8de2-4e93dcd5d96f' where id = '01dcf8c7-6c8a-4ee7-83b1-965a43efca05';
update clubs set logo_media_id = '48a17640-6611-455f-84cd-a5aed721abf6' where id = '32904ea7-7e8e-4cb2-8cf0-f74cdace4755';
update clubs set logo_media_id = 'dc88b467-6e65-4615-81ef-b55ab80e8fd6' where id = 'f0a35efd-9ed0-4344-8efb-ca1cb5cb832c';
update clubs set logo_media_id = '76dfc2b5-fbde-4131-8c1e-b60101974c2b' where id = '444993d4-febc-4518-8843-305f1144888b';
update clubs set logo_media_id = '66fe22dd-521a-4d57-8ca1-4a44baa17afe' where id = 'f1d60cf2-a2c1-4dc9-8153-6a5dff8f366f';
update clubs set logo_media_id = 'babeb1e4-37f2-4510-85e0-7b679aaf5a24' where id = 'df100b4b-0f28-40d3-8cbf-cdcc073fd58c';
update clubs set logo_media_id = '4d9d5ec0-d20c-40f6-82bd-c2399c0363fe' where id = '72d509ff-f2c1-4fde-82d0-f32b2caf8f94';
update clubs set logo_media_id = '6cf755a3-5947-4616-82b0-0dd37937c1db' where id = '29bbd0ea-d0aa-4b01-86c2-63676949e23f';
update clubs set logo_media_id = 'e6850239-9eeb-4964-850a-91796dce8a1b' where id = '49960c8f-9262-4a0e-8d1e-c529d10d5e46';
update clubs set logo_media_id = '64e0be1d-d2d7-4fac-84d8-a43fbb851367' where id = 'bbca24a7-9791-4af8-8183-cc661cd6a124';
update clubs set logo_media_id = '654518c9-2261-4051-8719-6e44544839c8' where id = '0c8800b3-5e62-492b-8888-83597253120e';
update clubs set logo_media_id = 'e83fa7ce-4d2f-42ba-864e-56eccd9e78c4' where id = 'bcd907ce-87fc-4f79-8f5a-9f798bd64522';
update clubs set logo_media_id = '074f6c81-4e6c-4692-81fb-6385a3246766' where id = 'c3b6690c-d908-4ca5-8ec5-c18858214a10';
update clubs set logo_media_id = '3cdc106e-1709-4b5f-8e81-9044db0ee52e' where id = 'f96dd9f9-4be2-470b-8afd-c64be0778a95';
update clubs set logo_media_id = '163b05ae-0d99-4afa-825a-4be235ac729d' where id = 'c6cfb089-a2a6-4ae3-8166-514f600b116f';
update clubs set logo_media_id = '5a0f4a28-b4a8-429d-8b04-fe79125640cb' where id = '2911c510-1491-4f92-88e7-3a76bd6d0b43';
update clubs set logo_media_id = '8ed2c8ec-dd2c-4a33-86e8-15b42a0e5f02' where id = '85776e81-a7b4-4ab8-880c-4aaf7cb46b45';
update clubs set logo_media_id = '04b15f2c-4571-42e1-8bb7-cae7e0355faa' where id = 'b4646b52-7783-45e4-810d-38d83ac2968d';
update clubs set logo_media_id = 'ae9d835a-80d6-4051-8f0f-522cf85b1623' where id = '76b39edd-97c1-408d-8556-5931ecf7c856';
update clubs set logo_media_id = '036f4024-051f-4896-89f2-4fad8ef37488' where id = '15074614-ae7f-492b-8e4f-78735b2ae7ab';
update clubs set logo_media_id = 'e35a86c5-d218-4f4c-8c3f-c71cd7a64a58' where id = 'b7d171b1-05ca-4848-884c-049ff8dd47d0';
update clubs set logo_media_id = '09b0fdb6-7f9b-46ed-89b8-a9c14029afe5' where id = '59296a5e-0965-420b-823b-62a498b6e45f';
update clubs set logo_media_id = '19fa4df4-5067-4e31-8f5c-272cb51e52da' where id = '886579eb-fd94-4606-8760-fa6cd0631db5';
update clubs set logo_media_id = 'fa3b57a7-5220-407f-86c3-0b61e4f9de45' where id = '40479ca7-67bd-4652-82be-2a4a6fd007ec';
update clubs set logo_media_id = 'fc5f4601-90a1-460a-8f41-2a52bc48b599' where id = '41dbef08-78eb-4d3a-8871-e0dc09e80a44';
update clubs set logo_media_id = 'a8b90f54-4ee6-472c-8873-3ed634fa7f36' where id = '99a9d1c7-13d6-4617-87f9-f97896701aa5';
update clubs set logo_media_id = '22afeec5-0c8a-47a0-86b2-a8f59723cc5b' where id = '573f3062-70a1-4bd4-88cd-6c0ee3d1b853';
update clubs set logo_media_id = '014820fd-d0ed-49cb-8389-0e9a4838c799' where id = '8f8b9380-9212-4e7a-8b1f-bc10dbc8cddc';
update clubs set logo_media_id = '55044880-c5f8-42cf-8fe6-33b08c427f0e' where id = 'd5c85293-5079-4869-81e9-9b738956c8ec';
update clubs set logo_media_id = 'a3c83dcc-aeea-4195-8937-509dc9f40bf1' where id = 'c8928090-08de-48fb-87b3-7d737cf77971';
update clubs set logo_media_id = 'a7bc075e-e1c3-465b-8f4a-9d5e60639a22' where id = '056b8126-eed6-4efe-8f1b-39b7d064956a';
update clubs set logo_media_id = 'd4010022-da6e-4409-8760-e3708a8ac587' where id = 'f5f45f01-2540-48a6-8060-73bef7b44ea4';
update clubs set logo_media_id = '838a9046-cbb8-4dcd-8ee6-afe187736a91' where id = '2697b6c7-0268-4173-8ace-99e82053e30b';
update clubs set logo_media_id = '4df37ba8-3f5e-4292-8b27-d916c7046b7c' where id = 'c94f0d01-57a0-4bd8-8a69-1d335a5df5dd';
update clubs set logo_media_id = '9be502c1-2a16-458c-888f-c2583e9d2e07' where id = 'd0191047-1954-48a0-81c8-ed2f35f3c13a';
update clubs set logo_media_id = '41f5d6c0-eee9-4e78-80d5-f58b8a110a40' where id = '3adb8fb6-b65c-47ad-8de7-be8191a28648';
update clubs set logo_media_id = '8ac6a81e-5f93-4622-89ca-ef9f98e228f8' where id = 'a0000000-0000-4000-8000-000000000002';
update clubs set logo_media_id = '6a0461d9-bd98-43c9-8476-d2a657e94ec7' where id = 'ca737381-82b9-4d75-8aa5-fa1e11b3e78f';
update clubs set logo_media_id = 'b8731b06-419d-41a9-8fc5-0ca08af5fa60' where id = '6c3d1649-cb26-410e-849a-cd3932a4f750';
update clubs set logo_media_id = '7431922b-9ef7-4092-8c70-a53f2a5436fa' where id = '231a71dc-0be2-4b65-8783-a4623511e756';
update clubs set logo_media_id = '0c0c7c5d-dacb-44da-8e04-4a3f10977c67' where id = '0c00a3c4-92db-489e-8dda-f109f1713805';
update clubs set logo_media_id = '69261839-d7b6-46be-812e-51cdcb23a667' where id = 'b768304d-506c-4636-8335-d6702566c482';
update clubs set logo_media_id = '7d980ecd-676d-4915-80ee-5ff8f47dcda2' where id = '84bc76e3-0651-4252-8d88-365dd2c9a3f8';
update clubs set logo_media_id = '52f918a0-b325-44de-8b65-7b0f199760c7' where id = '7f2f7911-39e3-46ec-86f2-cf6b2e5010de';
update clubs set logo_media_id = '8cc22d68-98f2-40fa-80db-a50113283b6f' where id = 'c6d31c56-f2e7-4d89-8fd7-b17d4ef47326';
update clubs set logo_media_id = '19a0cc34-4ed9-4c19-89b0-9f1271c1aa53' where id = '36c204f4-c51e-429d-8962-1807c69f1579';
update clubs set logo_media_id = '86c309fe-7a9a-4bd8-865b-9c115cb9e747' where id = '8675e5c5-d9ec-4124-8c94-b9dcba2701b0';
update clubs set logo_media_id = 'f970e376-1ae1-4941-86a9-40ea1c68b04f' where id = '013e344f-bad2-4270-856d-671e609f2eef';
update clubs set logo_media_id = '9abd6eb7-fc84-41a5-84ab-2d8be5db73d4' where id = 'e45f2f0a-801c-4332-80a1-688174a6a6d7';
update clubs set logo_media_id = '2eaf2b0b-6fad-415d-8aa4-f3f0e32b7af2' where id = 'c1af9532-bbbf-4a90-89aa-01349bae3d6a';
update clubs set logo_media_id = 'c4ee2e41-9ac4-4645-892d-5e97504b8af7' where id = '9c99fb23-6158-4d98-81c9-6d6977ec0e0c';
update clubs set logo_media_id = 'f75dc4e7-5e2a-4f1b-8c04-304027498b6e' where id = '2bf93706-5cd9-4408-89a3-b1091d7939c9';
update clubs set logo_media_id = 'bcdc1adf-bf24-4db1-8d4c-5a34e7e6c14c' where id = 'd85fb3b6-80dc-40ad-85b4-84191eac999b';
update clubs set logo_media_id = 'be42f488-edf5-47bc-8fa6-bf0d3d679263' where id = '25448586-1872-4b92-81bf-de6a9bd25bf3';
update clubs set logo_media_id = '4329cae1-a429-4247-86d8-a45d18d9fad7' where id = 'e586dcf9-7939-4dab-898b-646b28142f69';
update clubs set logo_media_id = '7dc20e5f-b4b8-4230-8c81-42ff7d37c4b4' where id = '87420cf1-f86e-4157-86e2-22cbf5417ed0';
update clubs set logo_media_id = '52ec835a-879c-4123-8cc9-1a0aeef5ed21' where id = 'a0000000-0000-4000-8000-000000000003';
update clubs set logo_media_id = '07cd7365-fe8e-4295-89f8-e7159f693144' where id = '4d7d8cc9-6ea4-44da-807a-6e3648026262';
update clubs set logo_media_id = '12bc4447-8b8d-48b7-8c92-400ec440e312' where id = 'c2cfcfa2-2647-4ded-8630-e15b7e6c5c13';
update clubs set logo_media_id = '6802f97a-60b6-415a-8743-c1ae37fdcfe7' where id = '96f142e0-b111-454a-8445-37b48bc62b74';
update clubs set logo_media_id = 'c5d82024-b4c5-41dd-8c27-098e40489ca6' where id = 'c790c1be-fbfc-4ae2-8e77-6e0e822476f9';
update clubs set logo_media_id = '9a3e40bf-ab0b-466d-8efd-f9dfcca0a36a' where id = '63ab9e2c-f9fa-472e-8e66-19ddc4c1f255';
update clubs set logo_media_id = 'd2cae5e2-2ae7-40f1-899c-0479090530f3' where id = '9a715a6e-20f6-4577-8bb1-ad54fc7da2e3';
update clubs set logo_media_id = 'fccbd3b5-5ffa-433c-8529-4718b67ca4eb' where id = 'f7d5a832-dc8b-4b51-8be4-2992aadd6a6c';
update clubs set logo_media_id = '80a47608-0070-423d-8bc9-31a8036d0775' where id = '3020e557-ed25-487a-8b2d-585066506bb2';
update clubs set logo_media_id = 'b03b9e67-a7d5-4276-89c7-91949aa7579f' where id = '993b8334-c3dd-4332-88a9-313b5a37a08d';
update clubs set logo_media_id = '3f7629b0-d66e-4455-8fb5-a4b63e2d682f' where id = '2a0059ef-76d5-4414-8399-556facad94a5';
update clubs set logo_media_id = '905784c9-2500-4617-8840-32ba0baa4280' where id = '8d21f43f-1b2c-4697-817c-899aa4d63527';
update clubs set logo_media_id = '6b6fbdb0-d94c-4745-8fa4-3fd32ff0073d' where id = 'b92a7a3e-a2ad-4937-873d-4ec6880c01e6';
update clubs set logo_media_id = 'a9f3b34d-ebb5-4395-8f83-6020c5498695' where id = '5a1217fd-cc3c-4ca2-80c6-cbbedfab7c4d';
update clubs set logo_media_id = '26462588-016f-4b70-8f37-8571cb8ec9d2' where id = 'd709b4c4-6ddf-4537-8bcc-fcd5bad2a8cb';
update clubs set logo_media_id = '82f63f14-a82d-43d7-89ee-2b0b8fce6647' where id = '490c67b8-681d-4fe9-803a-d69324d32779';
update clubs set logo_media_id = 'b815ce77-f477-449a-81a3-b44cb883bf90' where id = '3172bb13-89bf-41e4-886a-a505a1fcd5e6';
update clubs set logo_media_id = 'abfb63d9-e552-4496-8a8a-5d4f02ade4a7' where id = 'cd049995-6cfa-4930-8694-300a1f27d138';
update clubs set logo_media_id = '3239aaff-dad6-4a09-8306-95a65edf7a78' where id = 'b61b68e3-b7fa-4272-824e-0273426a30ba';
update clubs set logo_media_id = '5750df51-837d-4084-8bb3-d6af3bf3b685' where id = 'ee2ceb7f-6a54-43ca-847e-1a86788408bb';
update clubs set logo_media_id = '49b74bf0-3829-4476-869e-ad4a1ab12334' where id = '7e67d596-a7ae-46c1-8aeb-634e2f36b4cc';
update clubs set logo_media_id = '9eff58ee-5414-4013-8638-10cdad10aedc' where id = '992e3178-364a-4267-8675-9250fe13232b';
update clubs set logo_media_id = 'b0d1dffb-d4e0-4e66-84d5-fc6512a88148' where id = 'ae8ad1e5-c2d9-440b-8f2f-21c45522a36a';
update clubs set logo_media_id = 'fb5ccec4-2dd7-4e35-8dc7-3adc39e52d93' where id = '2ec7f86a-c6fd-45db-8d5e-b57e849432ea';
update clubs set logo_media_id = '5024954c-1b4c-4c9a-8389-f1470189c046' where id = '684b3ca0-e1d5-4e92-8c86-6ea03bf505e1';
update clubs set logo_media_id = 'f0728466-db6a-4c39-848f-985d71f00adc' where id = 'cb62bb0a-a97c-477c-81e6-e48e775c737b';
update clubs set logo_media_id = '7b694a79-8e59-4184-8d59-fb22635bd7d3' where id = '51ee3eec-c986-41d9-87e6-7d57e15e47b4';
update clubs set logo_media_id = 'abb363a7-6434-4375-8c9d-3056409ed31f' where id = '7fba1503-b015-4630-850d-d850162f4c36';
update clubs set logo_media_id = '0edb621b-7f20-461e-8286-1ca7ecfd369e' where id = 'd1c21376-8098-486b-81ea-057e9bf6502b';
update clubs set logo_media_id = 'cd491b33-2633-4774-86af-b8945f058896' where id = 'c4fb7bdb-b6e7-4760-81c3-4292a816f764';
update clubs set logo_media_id = '4def1ad2-2ddd-455e-80d7-2e26f48abc04' where id = '829e873d-ec2f-418f-8302-af21d89be010';
update clubs set logo_media_id = 'c56b2402-a556-4cd8-81b3-591910bc71d7' where id = '56ffd904-f807-45c4-8cee-4ede722e1e4c';
update clubs set logo_media_id = 'f3ef62e2-2406-4849-871b-8d13f91a1915' where id = '8b8fd7eb-73e4-47cf-821e-f7d0cff1f85d';
update clubs set logo_media_id = '505f4549-6343-46e3-85df-7d3d66ac71c2' where id = '3687d798-ef89-45dc-842a-13e686ef2e00';
update clubs set logo_media_id = '242427d7-cdd8-4748-8e04-dd888f642eae' where id = 'd346cfde-0583-493d-81a1-960a3ca41d3b';
update clubs set logo_media_id = '8f73f37d-bb8d-4b1a-865a-44ee72bb7dcf' where id = '95d57689-54fd-461b-887b-a76c26b9eeff';
update clubs set logo_media_id = 'a4b3e1f1-ec95-4591-8c94-018b2f55e735' where id = '9a055a6b-8f96-4061-8935-bc2faf074593';
update clubs set logo_media_id = 'ff0d4344-b0e9-408c-8848-3152c6c01273' where id = 'c1ca5d09-57a9-4ad3-861b-b403ed7f9d9e';
update clubs set logo_media_id = 'a0e0c229-a352-4992-8fd9-64eaf8c46586' where id = '73d773d4-c6dc-4f53-882e-89866ea1b8f7';
update clubs set logo_media_id = 'd560cc0e-d1ac-47c2-8713-fe8f4fb1f600' where id = 'ee69fa35-8b7f-4fd7-857e-2eaf24ef34a8';
update clubs set logo_media_id = '251254dd-d2da-4892-820e-7694caae6413' where id = '997c9217-0411-4168-8592-8c9e23eccc7d';
update clubs set logo_media_id = '22cae263-9420-4bda-8674-991b672bf080' where id = 'ffe7563d-8df7-44ef-8376-78574154732c';
update clubs set logo_media_id = 'dd547cdf-35bb-49ab-8a11-3f5287ee26d1' where id = '2eb79394-2494-4e59-8c09-c27e17e6e0a5';
update clubs set logo_media_id = '2252366a-6f6f-47b8-86c1-ae79eac67f48' where id = '8d619d6c-9ed4-4d2f-8274-085510c496d6';
update clubs set logo_media_id = 'cdf8b318-62ea-4fb2-8bdc-5ccd3fccc44f' where id = '899d1cdd-74c7-4ab9-8217-c469a3d0a25c';
update clubs set logo_media_id = 'db5ba75a-75f0-4ae1-8983-e0d386c2d3f1' where id = 'ca3889b6-f0d5-408a-8104-653b63b274dd';
update clubs set logo_media_id = 'ce3cda65-cf85-46a2-80c7-acd952c4db48' where id = '31b53ae7-78c7-44f5-8b20-5c65baa7f527';
update clubs set logo_media_id = 'a3ef070b-368a-4a12-87b9-236b69cf280e' where id = 'f214d80d-3b07-49b6-8d06-a7f04d52da52';
update clubs set logo_media_id = '3a45b8ca-0f07-44cf-8fb3-c6f17b2a8b9f' where id = 'aefda2f5-c71c-4b5d-80d8-89f34695a9c3';
update clubs set logo_media_id = '2ec4eb27-a4f5-4114-82d8-7e46e35e6c37' where id = 'fbda04b2-8a25-4e95-83d5-137bd497aba1';
update clubs set logo_media_id = 'baf2992e-91b9-40e9-8d72-569c5406149e' where id = 'c3569518-767f-4146-8133-394871b2e4cc';
update clubs set logo_media_id = '3779f8d6-c82b-4fce-81d8-6b6fe934685d' where id = '1bdbbd05-771a-4c2b-8781-9f84dfacba56';
update clubs set logo_media_id = '05143934-b91a-424c-897a-c394bad7c432' where id = '901dff06-3633-47e4-810e-9770ed762ea3';
update clubs set logo_media_id = '53ce66b3-9bbc-4411-8e0d-acf1636ba15d' where id = 'dd633903-6037-40e1-8c79-00fd19a9dfa4';
update clubs set logo_media_id = '805ed97d-167d-4614-898f-87c3e3bc08fe' where id = 'a156a7c5-3a22-4201-8c88-208b6d4631d2';
update clubs set logo_media_id = 'cb626ab7-b859-4aff-8070-672ed56ebe01' where id = '9b4a4fc7-ee35-4aac-8157-1400e43c0c23';
update clubs set logo_media_id = '9ac721e1-ce04-4c3d-804c-7d5cff536217' where id = '4d09f0c3-fe06-4bcf-8a18-ee0b41a93604';
update clubs set logo_media_id = 'a2331f17-3934-4e63-8b30-21e78fa9e91e' where id = '4b085022-0919-47dc-8ca9-5bd8ae13651d';
update clubs set logo_media_id = '7dd14439-96bc-43f3-8b20-ab241b4e097f' where id = '340254b4-d519-47f5-8314-644688efe810';
update clubs set logo_media_id = '2216098b-fada-422e-8a22-91db66f3a2e6' where id = '43eb2782-da0d-44cb-8494-bf1d37f60348';
update clubs set logo_media_id = 'ff9549d5-ab8a-4f47-8a2e-7de70cca916e' where id = 'cd5670cb-aa1f-483c-8a26-a784063b7379';
update clubs set logo_media_id = 'd647294d-1cbb-4e2f-83db-dc756ca5b098' where id = 'b2f06a1d-1875-4f51-831e-da5c0c618517';
update clubs set logo_media_id = 'fe8fcdaa-a50f-40b3-81ed-e97e109afc2f' where id = 'a0000000-0000-4000-8000-000000000004';
update clubs set logo_media_id = '9b967924-8f52-4b2c-80e5-77fc54eaccf2' where id = '1d69df5f-ba11-4293-8e35-51d35960be93';
update clubs set logo_media_id = 'b84dfbb2-dca5-405d-8fca-83a9ba778f27' where id = 'd2c5428b-7c95-42e3-8f93-e7df8d6a0056';
update clubs set logo_media_id = '460ecf57-f883-44b6-8a7e-c86e3a1fb567' where id = '2780b5e0-b6eb-4362-880c-b50dc16ed6d7';
update clubs set logo_media_id = 'f9064cc2-f6ad-4f51-8480-b961c694f4ab' where id = '339c5307-52ff-4747-851b-c0356aede0ec';
update clubs set logo_media_id = '6697b0bf-b263-4638-8de3-9469ca69aef2' where id = '3833e918-8885-480c-83bb-828f1c132b3a';
update clubs set logo_media_id = '0a490c7d-4483-47e8-85f7-577d1425c5f1' where id = 'a0000000-0000-4000-8000-000000000005';
update clubs set logo_media_id = '8169d5b4-280b-414e-852c-54207042d60d' where id = '5b304045-7368-49b5-8232-a89b02a799ec';
update clubs set logo_media_id = '3425e391-b464-4dae-8b8b-c2bd4c6f6c38' where id = 'a0000000-0000-4000-8000-000000000006';
update clubs set logo_media_id = '020eec44-164d-42d0-8f03-78261c303856' where id = '9eb3203a-fc50-486a-863d-6fb1be96ad1d';
update clubs set logo_media_id = '9d7caef1-72cc-48d0-89ea-ad0b6ab3fd71' where id = '8bada927-9cab-4c82-8ac9-f0e147a5824c';
update clubs set logo_media_id = '2af3b151-b5cf-4d97-889b-7a2678af5043' where id = '06eba7a8-66e4-4559-8bb8-381af6cae37c';
update clubs set logo_media_id = '97d3de34-3c8e-43b1-8a91-39b94a5bdfb2' where id = '2c3c4ae0-5e28-4603-8ca2-8557aedf10f6';
update clubs set logo_media_id = 'b526abd7-593a-4cbe-8e70-f2ca903af558' where id = 'da1585c2-a648-46bb-8738-777effe8a2eb';
update clubs set logo_media_id = '33c77e7e-9bdd-4d8f-8c6e-aed0e91f6c28' where id = 'a522058f-02a1-4397-8db3-6ca9a271eccb';
update clubs set logo_media_id = '3c38d231-19b9-4b30-8337-6aa61b14945a' where id = 'a11f929b-ed85-4ec4-8a45-825436d8bcfb';
update clubs set logo_media_id = '264eba6e-5745-4703-832d-0752277983ae' where id = 'bf848bb2-860c-483a-815d-22239e7733f7';
update clubs set logo_media_id = 'cac249b4-b27b-422d-8441-4a5d650a2a2e' where id = 'e80fbf6b-05e1-40a6-8cad-ec5938bf6b20';
update clubs set logo_media_id = '88038c44-d04a-4731-8055-4329a05eb7a4' where id = '2ca4cb97-5cb1-4af8-81a3-0b15fcbc0907';
update clubs set logo_media_id = '0db3573a-965e-4671-8ce3-57c11150bb08' where id = 'c6ab21b3-16b2-48c1-829e-8fec893ce7da';
update clubs set logo_media_id = 'f0b1b908-3b9a-446d-88e5-6bbd91f95ffa' where id = 'f07d121f-61a7-4f99-8de2-87585a6668d0';
update clubs set logo_media_id = '7bde1e0c-0a0d-4886-869c-1071fad45a96' where id = '0d8709bd-048d-4426-8412-0f2d82bec1d7';
update clubs set logo_media_id = '5e2b5fd3-c6c4-47f7-8e53-9ad5829045b6' where id = '74ce2615-c1ca-48f7-84e6-7d24a2630a87';
update clubs set logo_media_id = '26e324a0-c7e9-482c-8661-d505fb8868bb' where id = '5ab2ea49-ab98-4054-8ab9-af79252da337';
update clubs set logo_media_id = '498207c7-0ea8-472c-805c-2cc5a2634713' where id = '504a896f-487f-4978-8b69-0459705b0c80';
update clubs set logo_media_id = '4861e727-3fe2-4c8e-820d-9196ffa71422' where id = 'feef20cc-8fe7-4760-8448-467a19f18282';
update clubs set logo_media_id = '34b7d0a5-ac26-4b36-89aa-29320d91f726' where id = 'd88b4833-afdd-448c-83d5-79ed95e9798d';
update clubs set logo_media_id = '8fad2ef0-8ac5-4831-8747-aae22332d848' where id = 'c2269a0d-43e4-4423-87ea-7d83a913388f';
update clubs set logo_media_id = '0810314a-350a-457d-8cea-327e80efef66' where id = 'b172d3d0-3fbd-47b5-8735-c706326221ed';
update clubs set logo_media_id = 'b9592c9c-d5f7-4784-8f04-b2ab37e55a1a' where id = 'a4fdfc80-da91-4157-8ee4-a1056b7fa68e';
update clubs set logo_media_id = '41bcd9c3-ce33-4a1e-80a8-4f3013fa436d' where id = '8281bbb6-93b0-431c-8604-184c6802fc87';

commit;