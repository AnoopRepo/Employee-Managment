import json
import os
from datetime import datetime
from bson import ObjectId

class MockInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class MockDeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count

class MockCursor:
    def __init__(self, documents):
        self.documents = documents
        self._index = 0

    def sort(self, field, direction):
        # Direction -1 is descending, 1 is ascending
        reverse = (direction == -1)
        self.documents.sort(key=lambda x: x.get(field) or datetime.min, reverse=reverse)
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self.documents):
            raise StopAsyncIteration
        doc = self.documents[self._index]
        self._index += 1
        return doc

class MockCollection:
    def __init__(self, collection_name):
        self.name = collection_name
        self.file_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
            f"mock_{collection_name}.json"
        )
        if not os.path.exists(self.file_path):
            self._save_docs([])

    def _load_docs(self):
        try:
            with open(self.file_path, "r") as f:
                data = json.load(f)
                # Convert ISO strings back to datetime and ensure _id exists
                for doc in data:
                    if "created_at" in doc and isinstance(doc["created_at"], str):
                        try:
                            doc["created_at"] = datetime.fromisoformat(doc["created_at"])
                        except ValueError:
                            pass
                return data
        except Exception:
            return []

    def _save_docs(self, docs):
        serializable_docs = []
        for doc in docs:
            d = doc.copy()
            if "_id" in d:
                d["_id"] = str(d["_id"])
            if "created_at" in d and isinstance(d["created_at"], datetime):
                d["created_at"] = d["created_at"].isoformat()
            serializable_docs.append(d)
        with open(self.file_path, "w") as f:
            json.dump(serializable_docs, f, indent=2)

    async def find_one(self, query):
        docs = self._load_docs()
        for doc in docs:
            match = True
            for k, v in query.items():
                if k == "_id" or k == "id":
                    doc_id = str(doc.get("_id", doc.get("id")))
                    val_id = str(v)
                    if doc_id != val_id:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                if "_id" not in doc and "id" in doc:
                    doc["_id"] = ObjectId(doc["id"])
                elif "_id" in doc:
                    doc["_id"] = ObjectId(doc["_id"])
                return doc
        return None

    async def insert_one(self, document):
        docs = self._load_docs()
        
        if "_id" not in document:
            new_id = ObjectId()
            document["_id"] = new_id
            if "id" not in document:
                document["id"] = str(new_id)
        else:
            if "id" not in document:
                document["id"] = str(document["_id"])

        docs.append(document)
        self._save_docs(docs)
        return MockInsertResult(document["_id"])

    def find(self, query=None):
        if query is None:
            query = {}
        docs = self._load_docs()
        matched = []
        for doc in docs:
            match = True
            for k, v in query.items():
                if k == "_id" or k == "id":
                    doc_id = str(doc.get("_id", doc.get("id")))
                    val_id = str(v)
                    if doc_id != val_id:
                        match = False
                        break
                elif k == "user_id":
                    if str(doc.get("user_id")) != str(v):
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                if "_id" not in doc and "id" in doc:
                    doc["_id"] = ObjectId(doc["id"])
                elif "_id" in doc:
                    doc["_id"] = ObjectId(doc["_id"])
                matched.append(doc)
        return MockCursor(matched)

    async def delete_one(self, query):
        docs = self._load_docs()
        new_docs = []
        deleted = False
        for doc in docs:
            match = True
            for k, v in query.items():
                if k == "_id" or k == "id":
                    doc_id = str(doc.get("_id", doc.get("id")))
                    val_id = str(v)
                    if doc_id != val_id:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match and not deleted:
                deleted = True
            else:
                new_docs.append(doc)
        
        self._save_docs(new_docs)
        return MockDeleteResult(1 if deleted else 0)

    async def update_one(self, query, update):
        docs = self._load_docs()
        updated = False
        set_dict = update.get("$set", {})
        
        for doc in docs:
            match = True
            for k, v in query.items():
                if k == "_id" or k == "id":
                    doc_id = str(doc.get("_id", doc.get("id")))
                    val_id = str(v)
                    if doc_id != val_id:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                for uk, uv in set_dict.items():
                    doc[uk] = uv
                updated = True
                break
                
        if updated:
            self._save_docs(docs)
            
        class MockUpdateResult:
            def __init__(self, modified_count):
                self.modified_count = modified_count
                
        return MockUpdateResult(1 if updated else 0)

    async def delete_many(self, query):
        docs = self._load_docs()
        new_docs = []
        deleted_count = 0
        for doc in docs:
            match = True
            for k, v in query.items():
                if k == "_id" or k == "id":
                    doc_id = str(doc.get("_id", doc.get("id")))
                    val_id = str(v)
                    if doc_id != val_id:
                        match = False
                        break
                elif k == "user_id":
                    if str(doc.get("user_id")) != str(v):
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                deleted_count += 1
            else:
                new_docs.append(doc)
        
        if deleted_count > 0:
            self._save_docs(new_docs)
            
        return MockDeleteResult(deleted_count)


class MockDatabase:
    def __init__(self):
        self.users = MockCollection("users")
        self.reports = MockCollection("reports")
