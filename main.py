from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models, schemas
from auth import creat_token,verify_token

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#db dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#login api
@app.post("/login")
def login():
    return {
        "access_token": creat_token({"user":"admin"}),
        "token_type": "bearer"
    }


#home route
@app.get("/")
def home():
    return{
        "Message": "Blog API started."
    }

#create blog (protected)
@app.post("/create_blog", response_model=schemas.BlogResponse)
def create_blog(blog: schemas.BlogCreate, db: Session = Depends(get_db), user = Depends(verify_token)):
    new_blog = models.Blog(
        title = blog.title,
        content = blog.content,
    )
    db.add(new_blog)
    db.commit()
    db.refresh(new_blog)

    return new_blog

#read all blogs
@app.get("/blogs")
def get_blogs(page: int=1, limit: int=5, search: str=Query(default=""), db: Session = Depends(get_db)):
    query = db.query(models.Blog)
    if search:
        query = query.filter(models.Blog.title.ilike(f"%{search}%"))

    total = query.count()
    start = (page-1)*limit
    blogs = query.offset(start).limit(limit).all()

    return{
        "page": page,
        "limit": limit,
        "total": total,
        "data": blogs
    }

# read a specific blog
@app.get("/blogs/{blog_id}", response_model=schemas.BlogResponse)
def get_blog_byId(blog_id: int, db:Session = Depends(get_db)):
    blog = db.query(models.Blog).filter(models.Blog.id == blog_id).first()

    if not blog:
        raise HTTPException(
            status_code= 404,
            detail= "Blog not found."
        )
    return blog


#udpate blog api (protected)
@app.put("/blogs/{blog_id}", response_model=schemas.BlogResponse)
def update_blog_byId(blog_id:int, blog:schemas.BlogCreate, db:Session = Depends(get_db), user = Depends(verify_token)):
    existingBlog = db.query(models.Blog).filter(models.Blog.id == blog_id).first()

    if not existingBlog:
        raise HTTPException(
            status_code= 404,
            detail= "Blog not found."
        )
    existingBlog.title = blog.title
    existingBlog.content = blog.content

    db.commit()

    return existingBlog


#delete blog (protected)
@app.delete("/blogs/{blog_id}")
def delete_blog_byId(blog_id: int, db:Session = Depends(get_db), user = Depends(verify_token)):
    blog = db.query(models.Blog).filter(models.Blog.id == blog_id)

    if not blog.first():
        raise HTTPException(
            status_code= 404,
            detail= "Blog not found."
        ) 

    blog.delete()
    db.commit()

    return{
        "Message": "Blog Deleted Successfully!"
    }