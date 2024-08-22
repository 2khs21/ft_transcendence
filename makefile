up:
	docker compose up --build -d

build:
	docker compose build

back_re:
	docker compose up -d --no-deps backend
front:
	docker compose up -d --no-deps frontend

down:
	docker compose down --volumes

clean :
	docker compose -f docker-compose.yml down -v --rmi all --remove-orphans

fclean: clean
	docker system prune --volumes --all --force
	docker network prune --force
	docker volume prune --force
	docker image prune --force
	docker container prune --force
	-rm -rf data/
	-find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
	-find . -path "*/migrations/*.pyc" -delete

migrate:
	- docker compose run backend python manage.py makemigrations
	- docker compose run backend python manage.py migrate

re:
	make fclean
	make up