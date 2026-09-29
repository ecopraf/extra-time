-- EXTRA TIME — Smoke test del Football Data Core
-- Carica una catena di dati minima e verifica le query principali.
-- Uso: psql -v ON_ERROR_STOP=1 -f db/schema.sql -f db/smoke_test.sql

begin;

insert into regions (id,code,name) values ('00000000-0000-0000-0000-000000000001','LAZ','Lazio');
insert into provinces (id,region_id,code,name) values ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','RM','Roma');
insert into competitions (id,region_id,name,category,level) values ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','U15 Regionali','U15','giovanile');
insert into seasons (id,label,is_current) values ('00000000-0000-0000-0000-000000000004','2025/2026',true);
insert into competition_groups (id,competition_id,season_id,province_id,code,name) values ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000002','A','Girone A');

insert into clubs (id,canonical_name,province_id) values ('00000000-0000-0000-0000-000000000011','Albalonga','00000000-0000-0000-0000-000000000002');
insert into clubs (id,canonical_name,province_id) values ('00000000-0000-0000-0000-000000000012','LVPA Frascati','00000000-0000-0000-0000-000000000002');
insert into club_aliases (club_id,source,external_name) values
 ('00000000-0000-0000-0000-000000000011','LND','Albalonga Calcio'),
 ('00000000-0000-0000-0000-000000000011','FIGC','SSD Albalonga');

insert into teams (id,club_id,name,category) values ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000011','Albalonga U15','U15');
insert into teams (id,club_id,name,category) values ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000012','LVPA Frascati U15','U15');
insert into group_teams (group_id,team_id) values
 ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000021'),
 ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000022');

insert into players (id,first_name,last_name,birth_year,position) values ('00000000-0000-0000-0000-000000000031','Marco','Rossi',2009,'centrocampista');
insert into players (id,first_name,last_name,birth_year,position) values ('00000000-0000-0000-0000-000000000032','Luca','Verdi',2009,'attaccante');
insert into team_players (team_id,player_id,shirt_number) values
 ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000031',8),
 ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000032',9);

insert into matches (id,group_id,season_id,matchday,home_team_id,away_team_id,kickoff_at,status,home_score,away_score) values
 ('00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000004',1,'00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000022','2025-09-20 15:00+02','finished',3,1);
insert into match_events (match_id,team_id,player_id,minute,type) values
 ('00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000031',12,'goal'),
 ('00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000032',38,'goal'),
 ('00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000031',71,'goal'),
 ('00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000022',null,84,'goal');

insert into standings (group_id,team_id,position,played,won,drawn,lost,goals_for,goals_against,goal_diff,points) values
 ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000021',1,1,1,0,0,3,1,2,3),
 ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000022',2,1,0,0,1,1,3,-2,0);

insert into data_sources (id,code,name,kind) values ('00000000-0000-0000-0000-000000000051','LND_LAZIO','LND Lazio','manual');
insert into ingestion_runs (id,source_id,status,records_total,records_ok) values ('00000000-0000-0000-0000-000000000052','00000000-0000-0000-0000-000000000051','success',2,2);
insert into ingestion_records (run_id,entity_type,external_id,status,canonical_id) values
 ('00000000-0000-0000-0000-000000000052','club','LND-001','merged','00000000-0000-0000-0000-000000000011');

commit;

\echo '=== alias canonici ==='
select c.canonical_name, a.source, a.external_name from clubs c join club_aliases a on a.club_id=c.id order by a.source;

\echo '=== partita ==='
select hc.canonical_name as casa, m.home_score||'-'||m.away_score as risultato, ac.canonical_name as ospite
 from matches m
 join teams ht on ht.id=m.home_team_id join clubs hc on hc.id=ht.club_id
 join teams at on at.id=m.away_team_id join clubs ac on ac.id=at.club_id;

\echo '=== marcatori ==='
select e.minute, e.type, p.last_name from match_events e join players p on p.id=e.player_id order by e.minute;

\echo '=== classifica ==='
select c.canonical_name, s.position, s.points from standings s join teams t on t.id=s.team_id join clubs c on c.id=t.club_id order by s.position;
